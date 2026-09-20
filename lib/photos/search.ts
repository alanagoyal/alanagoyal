export const PHOTO_EMBEDDING_DIMENSIONS = 512;
export const PHOTO_SEARCH_MIN_QUERY_LENGTH = 2;
export const PHOTO_SEARCH_MAX_QUERY_LENGTH = 200;

export interface PhotoSearchMetadata {
  filename: string;
  caption: string;
  tags: string[];
  ocrText: string;
  collections: string[];
  timestamp?: string;
}

export interface PhotoSearchCandidate {
  id: string;
  filename: string;
  caption: string;
  tags: string[];
  ocrText: string;
  collections: string[];
  similarity: number;
}

export interface RankedPhotoSearchCandidate extends PhotoSearchCandidate {
  jevScore: number | null;
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
): Pick<PhotoSearchMetadata, "caption" | "tags" | "ocrText" | "collections"> | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const allowed = new Set(allowedCollections);
  const collections = cleanStringList(input.collections, allowed.size).filter((item) =>
    allowed.has(item),
  );
  const caption = cleanText(input.caption, 600);
  const tags = cleanStringList(input.tags, 24);
  const ocrText = cleanText(input.ocr_text, 1000);

  if (!caption && tags.length === 0 && !ocrText) return null;
  return { caption, tags, ocrText, collections };
}

export function buildPhotoSearchDocument(metadata: PhotoSearchMetadata): string {
  const parts = [
    metadata.caption,
    metadata.tags.length > 0 ? `Tags: ${metadata.tags.join(", ")}` : "",
    metadata.ocrText ? `Visible text: ${metadata.ocrText}` : "",
    metadata.collections.length > 0
      ? `Collections: ${metadata.collections.join(", ")}`
      : "",
    metadata.filename ? `Filename: ${metadata.filename}` : "",
    metadata.timestamp ? `Captured: ${metadata.timestamp}` : "",
  ];

  return parts.filter(Boolean).join("\n").slice(0, 4000);
}

export function normalizePhotoSearchQuery(value: unknown): string | null {
  const query = cleanText(value, PHOTO_SEARCH_MAX_QUERY_LENGTH);
  return query.length >= PHOTO_SEARCH_MIN_QUERY_LENGTH ? query : null;
}

export function rankPhotoSearchCandidates(
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
      const similarity = Math.min(1, Math.max(0, candidate.similarity));
      const score = jevScore === null ? similarity : similarity * 0.45 + jevScore * 0.55;
      return { ...candidate, similarity, jevScore, score };
    })
    .sort((a, b) => b.score - a.score || b.similarity - a.similarity);
}
