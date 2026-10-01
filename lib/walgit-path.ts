import { PROJECTS_DIR } from "./file-route-utils";

// @ cannot occur in a GitHub repository name, so providers cannot collide.
export const WALGIT_DIR = `${PROJECTS_DIR}/@walgit`;

export function isWalgitPath(path: string): boolean {
  return path === WALGIT_DIR || path.startsWith(`${WALGIT_DIR}/`);
}

export function parseWalgitPath(path: string): { owner?: string; repo?: string; filePath: string } | null {
  if (!isWalgitPath(path)) return null;
  const parts = path.slice(WALGIT_DIR.length).split("/").filter(Boolean);
  if (parts.some(part => part === "." || part === ".." || part.includes("\\"))) return null;
  return { owner: parts[0], repo: parts.length >= 2 ? `${parts[0]}/${parts[1]}` : undefined, filePath: parts.slice(2).join("/") };
}
