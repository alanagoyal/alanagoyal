import { Note } from "@/lib/notes/types";

export type GroupedNotes = Record<string, Note[]>;

export function groupNotesByCategory(notes: Note[], pinnedNotes: Set<string>) {
  const groupedNotes: GroupedNotes = {
    pinned: [],
  };

  // Calculate date boundaries once before the loop
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  notes.forEach((note) => {
    if (pinnedNotes.has(note.slug)) {
      groupedNotes.pinned.push(note);
      return;
    }

    let category = note.category ?? "older";
    if (!note.public) {
      const createdDate = new Date(note.created_at);

      if (createdDate.toDateString() === today.toDateString()) {
        category = "today";
      } else if (createdDate.toDateString() === yesterday.toDateString()) {
        category = "yesterday";
      } else if (createdDate > sevenDaysAgo) {
        category = "7";
      } else if (createdDate > thirtyDaysAgo) {
        category = "30";
      } else {
        category = "older";
      }
    }

    if (!groupedNotes[category]) {
      groupedNotes[category] = [];
    }
    groupedNotes[category].push(note);
  });

  return groupedNotes;
}

export function sortGroupedNotes(groupedNotes: GroupedNotes) {
  Object.keys(groupedNotes).forEach((category) => {
    groupedNotes[category].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  });
}

// Simple hash function to convert string to number
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Seeded random function
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const PUBLIC_DISPLAY_DATE_CACHE_KEY = "public-note-display-dates-v1";
const DAY_START_HOUR = 8; // 8:00 AM
const DAY_END_HOUR = 23; // 11:00 PM
const DAY_START_MINUTES = DAY_START_HOUR * 60;
const DAY_END_MINUTES = DAY_END_HOUR * 60;

let publicDisplayDateCache: Record<string, string> | null = null;

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function loadPublicDisplayDateCache(): Record<string, string> {
  if (publicDisplayDateCache) {
    return publicDisplayDateCache;
  }

  if (typeof window === "undefined") {
    publicDisplayDateCache = {};
    return publicDisplayDateCache;
  }

  try {
    const raw = window.sessionStorage.getItem(PUBLIC_DISPLAY_DATE_CACHE_KEY);
    if (!raw) {
      publicDisplayDateCache = {};
      return publicDisplayDateCache;
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      publicDisplayDateCache = parsed as Record<string, string>;
      return publicDisplayDateCache;
    }
  } catch {
    // Ignore storage errors and fall back to an in-memory cache.
  }

  publicDisplayDateCache = {};
  return publicDisplayDateCache;
}

function persistPublicDisplayDateCache(cache: Record<string, string>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      PUBLIC_DISPLAY_DATE_CACHE_KEY,
      JSON.stringify(cache)
    );
  } catch {
    // Ignore storage errors and keep the in-memory cache.
  }
}

function getLocalDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function getSessionSeed(sessionId?: string): string {
  if (sessionId) {
    return sessionId;
  }

  if (typeof window !== "undefined") {
    const storedSessionId = window.localStorage.getItem("session_id");
    if (storedSessionId) {
      return storedSessionId;
    }
  }

  return "anonymous-session";
}

function setTimeByMinutes(baseDate: Date, totalMinutes: number): Date {
  const date = new Date(baseDate);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function seededMinuteInRange(
  seedKey: string,
  minMinutes: number,
  maxMinutes: number
): number {
  if (maxMinutes <= minMinutes) {
    return Math.max(0, maxMinutes);
  }

  const randomValue = seededRandom(simpleHash(seedKey));
  return Math.floor(randomValue * (maxMinutes - minMinutes + 1)) + minMinutes;
}

function generatePublicDisplayDate(
  category: string | undefined,
  noteId: string,
  now: Date,
  sessionSeed: string
): Date {
  const daySeed = getLocalDayKey(now);
  const baseSeed = `${sessionSeed}:${daySeed}:${noteId}`;

  switch (category) {
    case "today": {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const minMinutes = currentMinutes >= DAY_START_MINUTES ? DAY_START_MINUTES : 0;
      const minutes = seededMinuteInRange(
        `${baseSeed}:todayTime`,
        minMinutes,
        currentMinutes
      );
      return setTimeByMinutes(now, minutes);
    }

    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const minutes = seededMinuteInRange(
        `${baseSeed}:yesterdayTime`,
        DAY_START_MINUTES,
        DAY_END_MINUTES
      );
      return setTimeByMinutes(yesterday, minutes);
    }

    case "7": {
      const daysAgo = Math.floor(seededRandom(simpleHash(`${baseSeed}:7days`)) * 6) + 2; // 2-7 days ago
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      const minutes = seededMinuteInRange(
        `${baseSeed}:7daysTime`,
        DAY_START_MINUTES,
        DAY_END_MINUTES
      );
      return setTimeByMinutes(date, minutes);
    }

    case "30": {
      const daysAgo = Math.floor(seededRandom(simpleHash(`${baseSeed}:30days`)) * 23) + 8; // 8-30 days ago
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      const minutes = seededMinuteInRange(
        `${baseSeed}:30daysTime`,
        DAY_START_MINUTES,
        DAY_END_MINUTES
      );
      return setTimeByMinutes(date, minutes);
    }

    case "older": {
      const daysAgo = Math.floor(seededRandom(simpleHash(`${baseSeed}:older`)) * 335) + 31; // 31-365 days ago
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      const minutes = seededMinuteInRange(
        `${baseSeed}:olderTime`,
        DAY_START_MINUTES,
        DAY_END_MINUTES
      );
      return setTimeByMinutes(date, minutes);
    }

    default: {
      const fallback = new Date(now);
      fallback.setHours(12, 0, 0, 0);
      return fallback;
    }
  }
}

function getSessionStablePublicDisplayDate(
  category: string | undefined,
  noteId: string,
  sessionId?: string
): Date {
  const now = new Date();
  const sessionSeed = getSessionSeed(sessionId);
  const dayKey = getLocalDayKey(now);
  const normalizedCategory = category ?? "unknown";
  // Keep cache keys independent of session ID so hydration/session init
  // doesn't cause a one-time timestamp jump after refresh.
  const cacheKey = `${dayKey}:${normalizedCategory}:${noteId}`;
  const cache = loadPublicDisplayDateCache();
  const cachedDateIso = cache[cacheKey];

  if (cachedDateIso) {
    const cachedDate = new Date(cachedDateIso);
    if (isValidDate(cachedDate)) {
      return cachedDate;
    }
  }

  // Backward compatibility: migrate any legacy session-scoped cache entry.
  const legacyKey = `${sessionSeed}:${dayKey}:${normalizedCategory}:${noteId}`;
  const legacyAnonymousKey = `anonymous-session:${dayKey}:${normalizedCategory}:${noteId}`;
  const legacyDateIso =
    cache[legacyKey] ?? (legacyKey !== legacyAnonymousKey ? cache[legacyAnonymousKey] : undefined);
  if (legacyDateIso) {
    const legacyDate = new Date(legacyDateIso);
    if (isValidDate(legacyDate)) {
      cache[cacheKey] = legacyDateIso;
      persistPublicDisplayDateCache(cache);
      return legacyDate;
    }
  }

  const generatedDate = generatePublicDisplayDate(
    category,
    noteId,
    now,
    sessionSeed
  );
  cache[cacheKey] = generatedDate.toISOString();
  persistPublicDisplayDateCache(cache);
  return generatedDate;
}

type DisplayDateOptions = {
  createdAt?: string;
  isPublic?: boolean;
  sessionId?: string;
};

export function getDisplayDateByCategory(
  category: string | undefined,
  noteId: string,
  options: DisplayDateOptions = {}
): Date {
  const { createdAt, isPublic = false, sessionId } = options;

  // Private notes should always show the true creation time.
  if (!isPublic && createdAt) {
    const createdDate = new Date(createdAt);
    if (isValidDate(createdDate)) {
      return createdDate;
    }
  }

  if (!isPublic) {
    return new Date();
  }

  return getSessionStablePublicDisplayDate(category, noteId, sessionId);
}
