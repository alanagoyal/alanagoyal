const CACHE_TTL_REPOS = 5 * 60 * 1000; // 5 minutes

export interface GitHubTreeItem {
  name: string;
  type: "file" | "dir";
  path: string;
}

export interface GitHubRecentFile {
  path: string;
  repo: string;
  modifiedAt: string;
}

interface GitHubClientCache {
  repos: string[] | null;
  reposFetchedAt: number;
  repoTrees: Record<string, GitHubTreeItem[]>;
  fileContents: Record<string, string>;
}

const cache: GitHubClientCache = {
  repos: null,
  reposFetchedAt: 0,
  repoTrees: {},
  fileContents: {},
};

interface FetchJsonOptions {
  signal?: AbortSignal;
  errorMessage: string;
  notFoundMessage?: string;
}

async function fetchGitHubJson<T>(url: string, options: FetchJsonOptions): Promise<T> {
  const { signal, errorMessage, notFoundMessage } = options;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    if (response.status === 404 && notFoundMessage) {
      throw new Error(notFoundMessage);
    }
    throw new Error(errorMessage);
  }
  return (await response.json()) as T;
}

export async function fetchGitHubRepos(): Promise<string[]> {
  if (cache.repos && Date.now() - cache.reposFetchedAt < CACHE_TTL_REPOS) {
    return cache.repos;
  }

  try {
    const data = await fetchGitHubJson<{ repos?: string[] }>("/api/github?type=repos", {
      errorMessage: "Failed to fetch repos",
    });
    cache.repos = data.repos ?? [];
    cache.reposFetchedAt = Date.now();
    return cache.repos;
  } catch {
    return cache.repos ?? [];
  }
}

export async function fetchGitHubRepoTree(repo: string): Promise<GitHubTreeItem[]> {
  if (cache.repoTrees[repo]) {
    return cache.repoTrees[repo];
  }

  try {
    const data = await fetchGitHubJson<{ tree?: GitHubTreeItem[] }>(
      `/api/github?type=tree&repo=${encodeURIComponent(repo)}`,
      { errorMessage: "Failed to fetch tree" }
    );
    const tree = data.tree ?? [];
    cache.repoTrees[repo] = tree;
    return tree;
  } catch {
    return [];
  }
}

export async function fetchGitHubFileContent(repo: string, path: string): Promise<string> {
  const cacheKey = `${repo}/${path}`;
  if (cacheKey in cache.fileContents) {
    return cache.fileContents[cacheKey];
  }

  const data = await fetchGitHubJson<{ content?: string }>(
    `/api/github?type=file&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`,
    {
      errorMessage: "Failed to fetch file",
      notFoundMessage: "File not found",
    }
  );
  const content = data.content ?? "";
  cache.fileContents[cacheKey] = content;
  return content;
}

export async function fetchGitHubFileContentOrNull(
  repo: string,
  path: string
): Promise<string | null> {
  try {
    return await fetchGitHubFileContent(repo, path);
  } catch (error) {
    if (error instanceof Error && error.message === "File not found") {
      return null;
    }
    throw error;
  }
}

export async function fetchGitHubRecentFiles(signal?: AbortSignal): Promise<GitHubRecentFile[]> {
  const data = await fetchGitHubJson<{ files?: GitHubRecentFile[] }>(
    "/api/github?type=recent-files",
    {
      signal,
      errorMessage: "Failed to fetch recent files",
    }
  );
  return data.files ?? [];
}
