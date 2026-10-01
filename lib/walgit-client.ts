import { createClient, type CallOptions, type ClientOptions } from "./vendor/walgit/repos";
import { parseWalgitPath, WALGIT_DIR } from "./walgit-path";

export interface WalgitItem {
  name: string;
  type: "file" | "dir";
  path: string;
}

export function readWalgitConfig(base?: string, repositories?: string) {
  if (!base?.trim()) return null;
  const url = new URL(base.trim());
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Walgit requires an HTTPS origin without credentials or a path.");
  }
  const repos = [...new Set((repositories ?? "").split(",").map(repo => repo.trim()).filter(Boolean))];
  if (!repos.length || repos.some(repo => !/^[A-Za-z0-9_-][A-Za-z0-9._-]*\/[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(repo))) {
    throw new Error("Configure Walgit repositories as comma-separated owner/name pairs.");
  }
  return { base: url.origin, repos };
}

// Only these explicitly published repositories appear; never enumerate a host.
export function createWalgitBrowser(base: string, repositories: string, fetcher?: ClientOptions["fetch"]) {
  const config = readWalgitConfig(base, repositories)!;
  const client = createClient({ base: config.base, lane: "bearer", interactive: false, fetch: fetcher });
  const heads = new Map<string, { sha: string; at: number }>();

  const repoFor = (path: string) => {
    const parsed = parseWalgitPath(path);
    if (!parsed?.repo || !config.repos.includes(parsed.repo)) throw new Error("Walgit repository is not configured.");
    return { parsed, repo: client.repo(parsed.repo) };
  };
  const headFor = async (path: string, opts: CallOptions) => {
    const { parsed, repo } = repoFor(path);
    const cached = heads.get(parsed.repo!);
    if (cached && Date.now() - cached.at < 60_000) return { parsed, repo, sha: cached.sha };
    const { head } = await repo.refs(opts);
    if (!head) return { parsed, repo, sha: null };
    heads.set(parsed.repo!, { sha: head.sha, at: Date.now() });
    return { parsed, repo, sha: head.sha };
  };

  return {
    async list(path: string, opts: CallOptions = {}): Promise<WalgitItem[]> {
      const parsed = parseWalgitPath(path);
      if (!parsed) throw new Error("Invalid Walgit path.");
      if (!parsed.owner) return [...new Set(config.repos.map(repo => repo.split("/")[0]))].map(owner => ({ name: owner, type: "dir", path: `${WALGIT_DIR}/${owner}` }));
      if (!parsed.repo) return config.repos.filter(repo => repo.startsWith(`${parsed.owner}/`)).map(repo => ({ name: repo.split("/")[1], type: "dir", path: `${WALGIT_DIR}/${repo}` }));
      const { repo, sha } = await headFor(path, opts);
      if (!sha) return [];
      const tree = await repo.tree(sha, parsed.filePath, opts);
      return tree.entries.filter(entry => entry.type !== "commit").map(entry => ({
        name: entry.name, type: entry.type === "tree" ? "dir" : "file",
        path: `${path}/${entry.name}`,
      }));
    },
    async text(path: string, opts: CallOptions = {}): Promise<string> {
      const { parsed, repo, sha } = await headFor(path, opts);
      if (!sha || !parsed.filePath) throw new Error("File not found.");
      const blob = await repo.blob(sha, parsed.filePath, opts);
      if (blob.binary) throw new Error("Walgit does not provide binary file downloads yet. Images and PDFs cannot be opened here.");
      if (blob.too_large) throw new Error("This file exceeds Walgit's text preview limit (currently 2 MiB).");
      if (blob.contents === undefined) throw new Error("Walgit returned no file contents.");
      return blob.contents;
    },
  };
}

export function isWalgitConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_WALGIT_URL?.trim();
}

let browser: ReturnType<typeof createWalgitBrowser> | undefined;
function getBrowser() {
  if (!isWalgitConfigured()) throw new Error("Walgit is not configured.");
  return browser ??= createWalgitBrowser(process.env.NEXT_PUBLIC_WALGIT_URL!, process.env.NEXT_PUBLIC_WALGIT_REPOS ?? "");
}

export function fetchWalgitDirectory(path: string, opts?: CallOptions) { return getBrowser().list(path, opts); }
export function fetchWalgitText(path: string, opts?: CallOptions) { return getBrowser().text(path, opts); }

export function walgitErrorMessage(error: unknown): string {
  if (error instanceof TypeError) return "Could not reach Walgit. Check the server connection and allowed site origins.";
  if (error instanceof Error && "status" in error && (error.status === 401 || error.status === 403)) return "This Walgit repository is not publicly readable.";
  return error instanceof Error ? error.message : "Could not load Walgit.";
}
