import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createPhotoEmbedding, isPhotoAIConfigured, PHOTO_COLLECTIONS } from "@/lib/photos/ai";
import { isJevConfigured, scorePhotoCandidatesWithJev } from "@/lib/photos/jev";
import {
  normalizePhotoSearchQuery,
  rankPhotoSearchCandidates,
  type PhotoSearchCandidate,
} from "@/lib/photos/search";
import {
  applyRateLimitHeaders,
  applySessionCookie,
  checkRateLimit,
  getClientIdentity,
  parseJsonBodyWithLimit,
  pickMostConstrainedRateLimit,
} from "@/lib/server/request-security";

export const maxDuration = 14;

const SEARCH_MAX_BODY_BYTES = 2 * 1024;
const SEARCH_RATE_LIMIT_SESSION = {
  scope: "photo_search_session",
  limit: 24,
  windowMs: 60_000,
} as const;
const SEARCH_RATE_LIMIT_IP = {
  scope: "photo_search_ip",
  limit: 90,
  windowMs: 60_000,
} as const;
const ALLOWED_COLLECTIONS = new Set<string>(PHOTO_COLLECTIONS);

interface PhotoSearchRow {
  id: string;
  filename: string;
  caption: string | null;
  tags: string[] | null;
  ocr_text: string | null;
  collections: string[] | null;
  similarity: number;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  const identity = getClientIdentity(request);
  const sessionRateLimit = checkRateLimit(identity.sessionId, SEARCH_RATE_LIMIT_SESSION);
  const ipRateLimit = checkRateLimit(identity.ip, SEARCH_RATE_LIMIT_IP);
  const activeRateLimit = pickMostConstrainedRateLimit([sessionRateLimit, ipRateLimit]);
  const jsonResponse = (body: unknown, init?: ResponseInit) => {
    const response = NextResponse.json(body, init);
    applyRateLimitHeaders(response.headers, activeRateLimit);
    applySessionCookie(response, identity);
    return response;
  };

  if (!sessionRateLimit.allowed || !ipRateLimit.allowed) {
    const blocked = !sessionRateLimit.allowed ? sessionRateLimit : ipRateLimit;
    const retryAfterSeconds = Math.max(1, Math.ceil(blocked.retryAfterMs / 1000));
    const response = jsonResponse(
      { error: "Too many photo searches. Try again shortly." },
      { status: 429 },
    );
    response.headers.set("Retry-After", retryAfterSeconds.toString());
    return response;
  }

  const parsed = await parseJsonBodyWithLimit<Record<string, unknown>>(
    request,
    SEARCH_MAX_BODY_BYTES,
  );
  if (!parsed.ok) {
    return jsonResponse(
      { error: parsed.reason === "too_large" ? "Request body too large" : "Invalid JSON body" },
      { status: parsed.reason === "too_large" ? 413 : 400 },
    );
  }

  const query = normalizePhotoSearchQuery(parsed.body.query);
  if (!query) {
    return jsonResponse({ error: "Search query must be between 2 and 200 characters" }, { status: 400 });
  }
  const rawCollection = parsed.body.collection;
  const collection = typeof rawCollection === "string" && rawCollection.length > 0
    ? rawCollection
    : null;
  if (collection && !ALLOWED_COLLECTIONS.has(collection)) {
    return jsonResponse({ error: "Invalid photo collection" }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase || !isPhotoAIConfigured()) {
    return jsonResponse({ error: "Photo search is not configured" }, { status: 503 });
  }

  try {
    const embedding = await createPhotoEmbedding({
      filename: "",
      caption: query,
      tags: [],
      ocrText: "",
      collections: [],
    });
    if (!embedding) {
      return jsonResponse({ error: "Could not understand this search" }, { status: 502 });
    }

    const { data, error } = await supabase.rpc("search_photos", {
      query_embedding_arg: embedding,
      match_threshold_arg: 0.08,
      match_count_arg: 40,
      collection_filter_arg: collection,
    });
    if (error) throw error;

    const candidates: PhotoSearchCandidate[] = ((data ?? []) as PhotoSearchRow[]).map((row) => ({
      id: row.id,
      filename: row.filename,
      caption: row.caption ?? "",
      tags: row.tags ?? [],
      ocrText: row.ocr_text ?? "",
      collections: row.collections ?? [],
      similarity: Number(row.similarity) || 0,
    }));
    const jevScores = isJevConfigured()
      ? await scorePhotoCandidatesWithJev(query, candidates)
      : new Map<string, number>();
    const ranked = rankPhotoSearchCandidates(candidates, jevScores);

    return jsonResponse({
      results: ranked.map(({ id, score, similarity, jevScore }) => ({
        id,
        score,
        similarity,
        jevScore,
      })),
      reranked: jevScores.size > 0,
    });
  } catch (error) {
    console.error("Photo search failed:", error);
    return jsonResponse({ error: "Photo search is temporarily unavailable" }, { status: 502 });
  }
}
