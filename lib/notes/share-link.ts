export function getPublicNoteUrl(origin: string, slug: string): string {
  const normalizedOrigin = origin.replace(/\/+$/, "");
  return `${normalizedOrigin}/notes/${encodeURIComponent(slug)}`;
}
