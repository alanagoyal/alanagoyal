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

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const BUCKET_STALE_AFTER_MS = 2 * 60 * 60 * 1000;

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
