export function getPdfProxyUrl(fileUrl: string): string {
  if (fileUrl.startsWith("/api/preview/pdf?")) {
    return fileUrl;
  }
  return `/api/preview/pdf?url=${encodeURIComponent(fileUrl)}`;
}

const HOME_DIR = "/Users/alanagoyal";
const PROJECTS_DIR = `${HOME_DIR}/Projects`;
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"];

export function getPreviewMetadataFromPath(
  filePath: string
): { fileUrl: string; fileType: "image" | "pdf" } | null {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const fileType: "image" | "pdf" | null = ext === "pdf" ? "pdf" : IMAGE_EXTENSIONS.includes(ext) ? "image" : null;
  if (!fileType) return null;

  if (filePath.startsWith(PROJECTS_DIR + "/")) {
    const relativePath = filePath.slice(PROJECTS_DIR.length + 1);
    const parts = relativePath.split("/");
    const repo = parts[0];
    const repoPath = parts.slice(1).join("/");
    const fileUrl = `https://raw.githubusercontent.com/alanagoyal/${repo}/main/${repoPath}`;
    return { fileUrl, fileType };
  }

  if (filePath.startsWith(`${HOME_DIR}/Documents/`)) {
    const fileName = filePath.slice(`${HOME_DIR}/Documents/`.length);
    const fileUrl = `/documents/${encodeURIComponent(fileName)}`;
    return { fileUrl, fileType };
  }

  return null;
}
