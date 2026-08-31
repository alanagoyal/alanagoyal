export function getPreviewFileKind(
  fileName: string,
  fileType: "image" | "pdf"
): string {
  if (fileType === "pdf") return "PDF document";

  const extension = fileName.split(".").pop()?.toLowerCase();
  const labels: Record<string, string> = {
    bmp: "BMP image",
    gif: "GIF image",
    ico: "Icon image",
    jpeg: "JPEG image",
    jpg: "JPEG image",
    png: "PNG image",
    svg: "SVG image",
    webp: "WebP image",
  };

  return extension ? (labels[extension] ?? `${extension.toUpperCase()} image`) : "Image";
}

export function formatPreviewFileSize(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return "Unavailable";
  if (bytes < 1_000) return `${Math.round(bytes)} bytes`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(bytes < 10_000 ? 1 : 0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function formatPreviewDimensions(width: number, height: number): string {
  return `${width.toLocaleString("en-US")} × ${height.toLocaleString("en-US")} pixels`;
}

export function getPreviewFileLocation(filePath: string): string {
  const segments = filePath.split("/").filter(Boolean);
  if (segments.length <= 1) return "/";
  return `/${segments.slice(0, -1).join("/")}`;
}
