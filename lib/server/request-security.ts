import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "anon_session_id";
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const textEncoder = new TextEncoder();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const BUCKET_STALE_AFTER_MS = 2 * 60 * 60 * 1000;

export type ClientIdentity = {
  ip: string;
  sessionId: string;
  shouldSetSessionCookie: boolean;
};

export type ParsedJsonBody<T> =
  | { ok: true; body: T }
  | { ok: false; reason: "too_large" | "invalid_json" };

type RateLimitBucket = {
  count: number;
  resetAt: number;
  lastSeenAt: number;
};

type RateLimitStore = {
  buckets: Map<string, RateLimitBucket>;
  lastCleanupAt: number;
};

type GlobalWithRateLimitStore = typeof globalThis & {
  __appRateLimitStore?: RateLimitStore;
};

export type RateLimitRule = {
  scope: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  scope: string;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

export function getClientIdentity(request: NextRequest): ClientIdentity {
  const existingSession = request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim();
  const hasExistingSession = typeof existingSession === "string" && existingSession.length > 0;
  const sessionId =
    hasExistingSession
      ? existingSession
      : crypto.randomUUID();

  return {
    ip: extractClientIp(request),
    sessionId,
    shouldSetSessionCookie: !hasExistingSession,
  };
}

export function applySessionCookie(
  response: NextResponse,
  identity: ClientIdentity
) {
  if (!identity.shouldSetSessionCookie) return;

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: identity.sessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function parseJsonBodyWithLimit<T>(
  request: Request,
  maxBytes: number
): Promise<ParsedJsonBody<T>> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const parsedLength = Number(contentLengthHeader);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      return { ok: false, reason: "too_large" };
    }
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  const bytes = textEncoder.encode(rawBody).byteLength;
  if (bytes > maxBytes) {
    return { ok: false, reason: "too_large" };
  }

  if (rawBody.trim().length === 0) {
    return { ok: false, reason: "invalid_json" };
  }

  try {
    const body = JSON.parse(rawBody) as T;
    return { ok: true, body };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}

export function checkRateLimit(
  key: string,
  rule: RateLimitRule
): RateLimitResult {
  const now = Date.now();
  const store = getStore(now);
  const bucketKey = `${rule.scope}:${key}`;
  let bucket = store.buckets.get(bucketKey);

  if (!bucket || now >= bucket.resetAt) {
    bucket = {
      count: 0,
      resetAt: now + rule.windowMs,
      lastSeenAt: now,
    };
  }

  bucket.lastSeenAt = now;

  if (bucket.count >= rule.limit) {
    store.buckets.set(bucketKey, bucket);
    return {
      allowed: false,
      scope: rule.scope,
      limit: rule.limit,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterMs: Math.max(bucket.resetAt - now, 0),
    };
  }

  bucket.count += 1;
  store.buckets.set(bucketKey, bucket);

  return {
    allowed: true,
    scope: rule.scope,
    limit: rule.limit,
    remaining: Math.max(rule.limit - bucket.count, 0),
    resetAt: bucket.resetAt,
    retryAfterMs: Math.max(bucket.resetAt - now, 0),
  };
}

export function pickMostConstrainedRateLimit(
  results: readonly RateLimitResult[]
): RateLimitResult {
  return results.reduce((selected, current) => {
    const selectedUsageRatio =
      selected.limit === 0 ? 1 : selected.remaining / selected.limit;
    const currentUsageRatio =
      current.limit === 0 ? 1 : current.remaining / current.limit;
    return currentUsageRatio < selectedUsageRatio ? current : selected;
  });
}

export function applyRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
) {
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000).toString());
  headers.set("X-RateLimit-Scope", result.scope);
}

function extractClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const candidates = [
    request.headers.get("x-real-ip"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("true-client-ip"),
    request.headers.get("x-client-ip"),
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return "unknown";
}

function getStore(now: number): RateLimitStore {
  const globalForRateLimit = globalThis as GlobalWithRateLimitStore;
  if (!globalForRateLimit.__appRateLimitStore) {
    globalForRateLimit.__appRateLimitStore = {
      buckets: new Map(),
      lastCleanupAt: now,
    };
    return globalForRateLimit.__appRateLimitStore;
  }

  const store = globalForRateLimit.__appRateLimitStore;
  if (now - store.lastCleanupAt >= CLEANUP_INTERVAL_MS) {
    cleanupStore(store, now);
  }

  return store;
}

function cleanupStore(store: RateLimitStore, now: number) {
  for (const [key, bucket] of store.buckets) {
    const isExpired = now >= bucket.resetAt;
    const isStale = now - bucket.lastSeenAt >= BUCKET_STALE_AFTER_MS;
    if (isExpired || isStale) {
      store.buckets.delete(key);
    }
  }
  store.lastCleanupAt = now;
}
