const GITHUB_USERNAME = "alanagoyal";
const CACHE_TTL_REPOS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_TREES = 2 * 60 * 60 * 1000; // 2 hours
const CACHE_TTL_FILES = 2 * 60 * 60 * 1000; // 2 hours

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
    // Ignore localStorage errors
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
    // Ignore localStorage errors
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
