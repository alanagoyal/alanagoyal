import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { PHOTO_COLLECTIONS } from "@/lib/photos/ai";
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
  search_text: string;
  collections: string[] | null;
  timestamp: string;
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
  if (!supabase || !isJevConfigured()) {
    return jsonResponse({ error: "Photo search is not configured" }, { status: 503 });
  }

  try {
    let photoQuery = supabase
      .from("photos")
      .select("id, filename, search_text, collections, timestamp")
      .not("search_text", "is", null)
      .order("timestamp", { ascending: false })
      .limit(250);
    if (collection) photoQuery = photoQuery.contains("collections", [collection]);

    const { data, error } = await photoQuery;
    if (error) throw error;

    const candidates: PhotoSearchCandidate[] = ((data ?? []) as PhotoSearchRow[]).map((row) => ({
      id: row.id,
      filename: row.filename,
      searchText: row.search_text,
      collections: row.collections ?? [],
      timestamp: row.timestamp,
    }));
    const jevScores = await scorePhotoCandidatesWithJev(query, candidates);
    const ranked = rankPhotoSearchCandidates(query, candidates, jevScores)
      .filter((candidate) => candidate.score >= 0.2)
      .slice(0, 60);

    return jsonResponse({
      results: ranked.map(({ id, score, jevScore, fallbackScore }) => ({
        id,
        score,
        jevScore,
        fallbackScore,
      })),
      reranked: jevScores.size > 0,
    });
  } catch (error) {
    console.error("Photo search failed:", error);
    return jsonResponse({ error: "Photo search is temporarily unavailable" }, { status: 502 });
  }
}
