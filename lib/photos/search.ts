export const PHOTO_SEARCH_MIN_QUERY_LENGTH = 2;
export const PHOTO_SEARCH_MAX_QUERY_LENGTH = 200;

export interface PhotoSearchCandidate {
  id: string;
  filename: string;
  searchText: string;
  collections: string[];
  timestamp: string;
}

export interface RankedPhotoSearchCandidate extends PhotoSearchCandidate {
  jevScore: number | null;
  fallbackScore: number;
  score: number;
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanStringList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const items: string[] = [];
  for (const item of value) {
    const normalized = cleanText(item, 80).toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    items.push(normalized);
    if (items.length >= maxItems) break;
  }
  return items;
}

export function normalizePhotoAnalysis(
  value: unknown,
  allowedCollections: readonly string[],
): { searchText: string; collections: string[] } | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const allowed = new Set(allowedCollections);
  const collections = cleanStringList(input.collections, allowed.size).filter((item) =>
    allowed.has(item),
  );
  const searchText = cleanText(input.search_text, 1_200);

  if (!searchText) return null;
  return { searchText, collections };
}

export function normalizePhotoSearchQuery(value: unknown): string | null {
  const query = cleanText(value, PHOTO_SEARCH_MAX_QUERY_LENGTH);
  return query.length >= PHOTO_SEARCH_MIN_QUERY_LENGTH ? query : null;
}

function tokenize(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function scorePhotoTextMatch(query: string, candidate: PhotoSearchCandidate): number {
  const queryTokens = [...new Set(tokenize(query))];
  if (queryTokens.length === 0) return 0;
  const candidateTokens = new Set(
    tokenize(
      `${candidate.searchText} ${candidate.filename} ${candidate.collections.join(" ")} ${candidate.timestamp}`,
    ),
  );
  const matched = queryTokens.filter((token) => candidateTokens.has(token)).length;
  return matched / queryTokens.length;
}

export function rankPhotoSearchCandidates(
  query: string,
  candidates: PhotoSearchCandidate[],
  jevScores: ReadonlyMap<string, number>,
): RankedPhotoSearchCandidate[] {
  return candidates
    .map((candidate) => {
      const rawJevScore = jevScores.get(candidate.id);
      const jevScore =
        typeof rawJevScore === "number" && Number.isFinite(rawJevScore)
          ? Math.min(1, Math.max(0, rawJevScore))
          : null;
      const fallbackScore = scorePhotoTextMatch(query, candidate);
      const score = jevScore ?? fallbackScore;
      return { ...candidate, fallbackScore, jevScore, score };
    })
    .sort((a, b) => b.score - a.score || b.fallbackScore - a.fallbackScore);
}
