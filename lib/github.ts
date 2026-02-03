const GITHUB_USERNAME = "alanagoyal";
const CACHE_TTL_REPOS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_TREES = 2 * 60 * 60 * 1000; // 2 hours
const CACHE_TTL_FILES = 2 * 60 * 60 * 1000; // 2 hours
const CACHE_TTL_RECENT_FILES = 15 * 60 * 1000; // 15 minutes
const MAX_COMMITS_TO_FETCH = 15;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
}

interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
}

// In-memory cache with localStorage persistence
const STORAGE_KEY = "github_cache";
const cache = new Map<string, CacheEntry<unknown>>();

// Load cache from localStorage on init
function loadCache(): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]) => {
        cache.set(key, value as CacheEntry<unknown>);
      });
    }
  } catch {
    // Silently ignore localStorage errors (quota exceeded, private browsing, etc.)
  }
}

// Save cache to localStorage
function saveCache(): void {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, CacheEntry<unknown>> = {};
    cache.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Silently ignore localStorage errors (quota exceeded, private browsing, etc.)
  }
}

// Initialize cache from storage
loadCache();

function getCached<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
  saveCache();
}

export async function fetchUserRepos(): Promise<GitHubRepo[]> {
  const cacheKey = `repos:${GITHUB_USERNAME}`;
  const cached = getCached<GitHubRepo[]>(cacheKey, CACHE_TTL_REPOS);
  if (cached) return cached;

  const response = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
      next: { revalidate: 3600 }, // Next.js cache for 1 hour
    }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("GitHub API rate limit exceeded");
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const repos = await response.json();
  setCache(cacheKey, repos);
  return repos;
}

export async function fetchRepoTree(
  repo: string
): Promise<{ name: string; type: "file" | "dir"; path: string }[]> {
  const cacheKey = `tree:${GITHUB_USERNAME}/${repo}`;
  const cached = getCached<{ name: string; type: "file" | "dir"; path: string }[]>(
    cacheKey,
    CACHE_TTL_TREES
  );
  if (cached) return cached;

  // Get the default branch first
  const repoResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repo}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }
  );

  if (!repoResponse.ok) {
    throw new Error(`Failed to fetch repo info: ${repoResponse.status}`);
  }

  const repoInfo = await repoResponse.json();
  const defaultBranch = repoInfo.default_branch || "main";

  // Get the tree recursively
  const treeResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }
  );

  if (!treeResponse.ok) {
    throw new Error(`Failed to fetch tree: ${treeResponse.status}`);
  }

  const treeData = await treeResponse.json();
  const items = (treeData.tree as GitHubTreeItem[]).map((item) => ({
    name: item.path.split("/").pop() || item.path,
    type: item.type === "tree" ? ("dir" as const) : ("file" as const),
    path: item.path,
  }));

  setCache(cacheKey, items);
  return items;
}

export async function fetchFileContent(
  repo: string,
  path: string
): Promise<string> {
  const cacheKey = `file:${GITHUB_USERNAME}/${repo}/${path}`;
  const cached = getCached<string>(cacheKey, CACHE_TTL_FILES);
  if (cached) return cached;

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repo}/contents/${path}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("File not found");
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  // GitHub returns base64 encoded content for files
  if (data.encoding === "base64" && data.content) {
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    setCache(cacheKey, content);
    return content;
  }

  // For large files, GitHub returns a download URL
  if (data.download_url) {
    const fileResponse = await fetch(data.download_url);
    const content = await fileResponse.text();
    setCache(cacheKey, content);
    return content;
  }

  throw new Error("Unable to fetch file content");
}

export function getRepoNames(repos: GitHubRepo[]): string[] {
  return repos.map((repo) => repo.name);
}

export interface RecentlyModifiedFile {
  path: string;
  repo: string;
  modifiedAt: string;
}

interface GitHubPushEvent {
  type: string;
  repo: {
    name: string;
  };
  payload: {
    head?: string;
    before?: string;
    size?: number;
    commits?: Array<{
      sha: string;
      message: string;
      distinct: boolean;
    }>;
  };
  created_at: string;
}

interface GitHubCommitDetail {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
  files?: Array<{
    filename: string;
    status: string;
  }>;
}

export async function fetchRecentlyModifiedFiles(): Promise<RecentlyModifiedFile[]> {
  const cacheKey = `recent-files:${GITHUB_USERNAME}`;
  const cached = getCached<RecentlyModifiedFile[]>(cacheKey, CACHE_TTL_RECENT_FILES);
  if (cached) return cached;

  try {
    // Fetch recent push events for the user
    const eventsResponse = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/events?per_page=30`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!eventsResponse.ok) {
      if (eventsResponse.status === 403) {
        throw new Error("GitHub API rate limit exceeded");
      }
      throw new Error(`GitHub API error: ${eventsResponse.status}`);
    }

    const events: GitHubPushEvent[] = await eventsResponse.json();

    // Filter to only PushEvents and collect commit SHAs with their repos
    const pushEvents = events.filter((e) => e.type === "PushEvent");

    // Collect commit info from push events
    // Use commits array if available (authenticated), otherwise use head SHA
    const commitInfos: Array<{
      repo: string;
      sha: string;
      createdAt: string;
    }> = [];

    const seenShas = new Set<string>();

    for (const event of pushEvents) {
      const repoFullName = event.repo.name;
      const repoName = repoFullName.split("/")[1];

      // Try commits array first (available with auth)
      if (event.payload.commits && event.payload.commits.length > 0) {
        for (const commit of event.payload.commits) {
          if (commit.distinct && !seenShas.has(commit.sha)) {
            seenShas.add(commit.sha);
            commitInfos.push({
              repo: repoName,
              sha: commit.sha,
              createdAt: event.created_at,
            });
          }
        }
      } else if (event.payload.head && !seenShas.has(event.payload.head)) {
        // Fall back to head SHA from push event
        seenShas.add(event.payload.head);
        commitInfos.push({
          repo: repoName,
          sha: event.payload.head,
          createdAt: event.created_at,
        });
      }
    }

    // Limit commits to avoid too many API calls
    const limitedCommits = commitInfos.slice(0, MAX_COMMITS_TO_FETCH);

    // Fetch file details for each commit
    const fileMap = new Map<string, RecentlyModifiedFile>();

    await Promise.all(
      limitedCommits.map(async (commitInfo) => {
        try {
          const commitResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${commitInfo.repo}/commits/${commitInfo.sha}`,
            {
              headers: {
                Accept: "application/vnd.github.v3+json",
                ...(process.env.GITHUB_TOKEN && {
                  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                }),
              },
            }
          );

          if (!commitResponse.ok) return;

          const commitDetail: GitHubCommitDetail = await commitResponse.json();
          const files = commitDetail.files || [];

          for (const file of files) {
            // Skip deleted files
            if (file.status === "removed") continue;

            const key = `${commitInfo.repo}/${file.filename}`;

            // Only keep the most recent modification
            if (!fileMap.has(key)) {
              fileMap.set(key, {
                path: file.filename,
                repo: commitInfo.repo,
                modifiedAt: commitDetail.commit.author.date,
              });
            }
          }
        } catch {
          // Silently skip commits that fail to fetch
        }
      })
    );

    // Verify files still exist by checking repo trees
    const repoNames = [...new Set(Array.from(fileMap.values()).map(f => f.repo))];
    const repoTrees = new Map<string, Set<string>>();

    await Promise.all(
      repoNames.map(async (repo) => {
        try {
          const tree = await fetchRepoTree(repo);
          repoTrees.set(repo, new Set(tree.map(t => t.path)));
        } catch {
          // If we can't fetch tree, assume all files exist
          repoTrees.set(repo, new Set());
        }
      })
    );

    // Filter to only files that exist in current tree
    const existingFiles = Array.from(fileMap.values()).filter(f => {
      const tree = repoTrees.get(f.repo);
      // If tree is empty (fetch failed), include the file
      // Otherwise, only include if file exists in tree
      return !tree || tree.size === 0 || tree.has(f.path);
    });

    // Sort by modification date (most recent first)
    const recentFiles = existingFiles.sort(
      (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    );

    // Limit to 50 most recent files
    const result = recentFiles.slice(0, 50);

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error fetching recent files:", error);
    return [];
  }
}
