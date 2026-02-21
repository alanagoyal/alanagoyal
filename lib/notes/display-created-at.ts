import { Note } from "@/lib/notes/types";

const PUBLIC_DISPLAY_CREATED_AT_KEY = "public-note-display-created-at-v2";
const DAY_START_MINUTES = 8 * 60; // 8:00 AM
const DAY_END_MINUTES = 23 * 60; // 11:00 PM

type DisplayCreatedAtCache = Record<string, string>;

let publicDisplayCreatedAtCache: DisplayCreatedAtCache | null = null;

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function getDisplayCache(): DisplayCreatedAtCache {
  if (publicDisplayCreatedAtCache) {
    return publicDisplayCreatedAtCache;
  }

  if (typeof window === "undefined") {
    publicDisplayCreatedAtCache = {};
    return publicDisplayCreatedAtCache;
  }

  try {
    const rawCache = window.sessionStorage.getItem(PUBLIC_DISPLAY_CREATED_AT_KEY);
    if (!rawCache) {
      publicDisplayCreatedAtCache = {};
      return publicDisplayCreatedAtCache;
    }

    const parsed = JSON.parse(rawCache);
    if (parsed && typeof parsed === "object") {
      publicDisplayCreatedAtCache = parsed as DisplayCreatedAtCache;
      return publicDisplayCreatedAtCache;
    }
  } catch {
    // Ignore storage errors and fall back to in-memory cache.
  }

  publicDisplayCreatedAtCache = {};
  return publicDisplayCreatedAtCache;
}

function saveDisplayCache(cache: DisplayCreatedAtCache) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(PUBLIC_DISPLAY_CREATED_AT_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors and keep in-memory cache.
  }
}

function toDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function randomInt(min: number, max: number): number {
  if (max <= min) {
    return min;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function withMinutes(baseDate: Date, totalMinutes: number): Date {
  const date = new Date(baseDate);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function generatePublicDisplayDate(note: Note, now: Date): Date {
  switch (note.category) {
    case "today": {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const minMinutes = currentMinutes >= DAY_START_MINUTES ? DAY_START_MINUTES : 0;
      const minutes = randomInt(minMinutes, currentMinutes);
      return withMinutes(now, minutes);
    }

    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const minutes = randomInt(DAY_START_MINUTES, DAY_END_MINUTES);
      return withMinutes(yesterday, minutes);
    }

    case "7": {
      const date = new Date(now);
      date.setDate(date.getDate() - randomInt(2, 7));
      const minutes = randomInt(DAY_START_MINUTES, DAY_END_MINUTES);
      return withMinutes(date, minutes);
    }

    case "30": {
      const date = new Date(now);
      date.setDate(date.getDate() - randomInt(8, 30));
      const minutes = randomInt(DAY_START_MINUTES, DAY_END_MINUTES);
      return withMinutes(date, minutes);
    }

    case "older": {
      const date = new Date(now);
      date.setDate(date.getDate() - randomInt(31, 365));
      const minutes = randomInt(DAY_START_MINUTES, DAY_END_MINUTES);
      return withMinutes(date, minutes);
    }

    default: {
      const createdAt = new Date(note.created_at);
      return isValidDate(createdAt) ? createdAt : now;
    }
  }
}

export function withDisplayCreatedAt(note: Note): Note {
  if (!note.public) {
    return { ...note, display_created_at: note.created_at };
  }

  // Keep server render deterministic; generate fake public timestamps on client only.
  if (typeof window === "undefined") {
    return { ...note, display_created_at: note.created_at };
  }

  const now = new Date();
  const cache = getDisplayCache();
  const cacheKey = `${toDayKey(now)}:${note.category ?? "unknown"}:${note.id}`;
  const cachedValue = cache[cacheKey];

  if (cachedValue) {
    const cachedDate = new Date(cachedValue);
    if (isValidDate(cachedDate)) {
      return { ...note, display_created_at: cachedValue };
    }
  }

  const generatedDate = generatePublicDisplayDate(note, now);
  const clampedDate = generatedDate > now ? now : generatedDate;
  const displayCreatedAt = clampedDate.toISOString();

  cache[cacheKey] = displayCreatedAt;
  saveDisplayCache(cache);

  return { ...note, display_created_at: displayCreatedAt };
}

export function withDisplayCreatedAtForNotes(notes: Note[]): Note[] {
  return notes.map((note) => withDisplayCreatedAt(note));
}

export function getDisplayCreatedAt(note: Note): string {
  return note.display_created_at ?? note.created_at;
}
