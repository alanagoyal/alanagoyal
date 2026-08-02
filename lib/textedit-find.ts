export const TEXTEDIT_OPEN_FIND_EVENT = "textedit:open-find";

export interface TextEditMatch {
  start: number;
  end: number;
}

export function findTextMatches(content: string, query: string): TextEditMatch[] {
  if (!query) return [];

  const matches: TextEditMatch[] = [];
  const normalizedContent = content.toLocaleLowerCase();
  const normalizedQuery = query.toLocaleLowerCase();
  let searchFrom = 0;

  while (searchFrom <= normalizedContent.length - normalizedQuery.length) {
    const start = normalizedContent.indexOf(normalizedQuery, searchFrom);
    if (start === -1) break;

    matches.push({ start, end: start + query.length });
    searchFrom = start + query.length;
  }

  return matches;
}

export function replaceTextMatch(
  content: string,
  match: TextEditMatch,
  replacement: string
): string {
  return `${content.slice(0, match.start)}${replacement}${content.slice(match.end)}`;
}

export function replaceAllTextMatches(
  content: string,
  matches: TextEditMatch[],
  replacement: string
): string {
  return [...matches]
    .reverse()
    .reduce((nextContent, match) => replaceTextMatch(nextContent, match, replacement), content);
}
