export function getPdfProxyUrl(fileUrl: string): string {
  if (fileUrl.startsWith("/api/preview/pdf?")) {
    return fileUrl;
  }
  return `/api/preview/pdf?url=${encodeURIComponent(fileUrl)}`;
}
