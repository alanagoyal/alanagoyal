export type SearchParams = Record<string, string | string[] | undefined>;

export function getSearchString(searchParams?: SearchParams): string {
  if (!searchParams) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
    } else if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
