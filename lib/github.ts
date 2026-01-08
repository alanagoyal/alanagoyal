const GITHUB_USERNAME = "alanagoyal";
const CACHE_TTL_REPOS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_FILES = 10 * 60 * 1000; // 10 minutes

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

// In-memory cache
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
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
      next: { revalidate: 300 }, // Next.js cache for 5 minutes
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
    CACHE_TTL_FILES
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
