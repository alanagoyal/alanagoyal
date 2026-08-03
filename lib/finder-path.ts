import { HOME_DIR, PROJECTS_DIR } from "@/lib/file-route-utils";

export interface FinderPathSegment {
  label: string;
  path: string;
}

const FINDER_ROOTS = [
  { label: "Desktop", path: `${HOME_DIR}/Desktop` },
  { label: "Documents", path: `${HOME_DIR}/Documents` },
  { label: "Downloads", path: `${HOME_DIR}/Downloads` },
  { label: "Projects", path: PROJECTS_DIR },
];

export function getFinderPathSegments(path: string): FinderPathSegment[] {
  if (path === "recents") return [{ label: "Recents", path }];
  if (path === "applications") return [{ label: "Applications", path }];

  if (path === "trash" || path.startsWith("trash/")) {
    const segments: FinderPathSegment[] = [{ label: "Trash", path: "trash" }];
    let currentPath = "trash";
    for (const part of path.slice("trash".length).split("/").filter(Boolean)) {
      currentPath += `/${part}`;
      segments.push({ label: part, path: currentPath });
    }
    return segments;
  }

  const root = FINDER_ROOTS.find(
    (candidate) => path === candidate.path || path.startsWith(`${candidate.path}/`)
  );
  if (!root) {
    return [{ label: path.split("/").filter(Boolean).at(-1) ?? path, path }];
  }

  const segments: FinderPathSegment[] = [{ ...root }];
  let currentPath = root.path;
  for (const part of path.slice(root.path.length).split("/").filter(Boolean)) {
    currentPath += `/${part}`;
    segments.push({ label: part, path: currentPath });
  }
  return segments;
}
