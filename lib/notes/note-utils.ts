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

export function getDisplayDateByCategory(category: string | undefined, noteId: string, createdAt?: string): Date {
  const today = new Date();

  // Private notes pass their real created_at — use it directly so the display
  // date is accurate even when category is null from a direct RPC fetch.
  if (createdAt) {
    return new Date(createdAt);
  }

  switch (category) {
    case "today":
      // Public/demo notes: fixed 8AM-11PM range matching all other categories
      const todayDate = new Date(today);
      const timeSeedToday = simpleHash(noteId + "todayTime");
      const randomMinutesToday = Math.floor(seededRandom(timeSeedToday) * (23 * 60 - 8 * 60)) + 8 * 60;
      const hourToday = Math.floor(randomMinutesToday / 60);
      const minuteToday = randomMinutesToday % 60;

      todayDate.setHours(hourToday, minuteToday, 0, 0);
      return todayDate;

    case "yesterday":
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Random time between 8:00 AM and 11:00 PM
      const timeSeedYesterday = simpleHash(noteId + "yesterdayTime");
      const minMinutes = 8 * 60; // 8:00 AM in minutes
      const maxMinutes = 23 * 60; // 11:00 PM in minutes
      const randomMinutesYesterday = Math.floor(seededRandom(timeSeedYesterday) * (maxMinutes - minMinutes)) + minMinutes;
      const hourYesterday = Math.floor(randomMinutesYesterday / 60);
      const minuteYesterday = randomMinutesYesterday % 60;

      yesterday.setHours(hourYesterday, minuteYesterday, 0, 0);
      return yesterday;

    case "7":
      // Deterministic "random" date 2-7 days ago based on note ID
      const seed7 = simpleHash(noteId + "7days");
      const daysAgo7 = Math.floor(seededRandom(seed7) * 6) + 2; // Between 2-7
      const date7 = new Date(today);
      date7.setDate(date7.getDate() - daysAgo7);

      // Random time between 8:00 AM and 11:00 PM
      const timeSeed7 = simpleHash(noteId + "7daysTime");
      const randomMinutes7 = Math.floor(seededRandom(timeSeed7) * (23 * 60 - 8 * 60)) + 8 * 60;
      const hour7 = Math.floor(randomMinutes7 / 60);
      const minute7 = randomMinutes7 % 60;

      date7.setHours(hour7, minute7, 0, 0);
      return date7;

    case "30":
      // Deterministic "random" date 8-30 days ago based on note ID
      const seed30 = simpleHash(noteId + "30days");
      const daysAgo30 = Math.floor(seededRandom(seed30) * 23) + 8; // Between 8-30
      const date30 = new Date(today);
      date30.setDate(date30.getDate() - daysAgo30);

      // Random time between 8:00 AM and 11:00 PM
      const timeSeed30 = simpleHash(noteId + "30daysTime");
      const randomMinutes30 = Math.floor(seededRandom(timeSeed30) * (23 * 60 - 8 * 60)) + 8 * 60;
      const hour30 = Math.floor(randomMinutes30 / 60);
      const minute30 = randomMinutes30 % 60;

      date30.setHours(hour30, minute30, 0, 0);
      return date30;

    case "older":
      // Deterministic "random" date 31-365 days ago based on note ID
      const seedOlder = simpleHash(noteId + "older");
      const daysAgoOlder = Math.floor(seededRandom(seedOlder) * 335) + 31; // Between 31-365
      const dateOlder = new Date(today);
      dateOlder.setDate(dateOlder.getDate() - daysAgoOlder);

      // Random time between 8:00 AM and 11:00 PM
      const timeSeedOlder = simpleHash(noteId + "olderTime");
      const randomMinutesOlder = Math.floor(seededRandom(timeSeedOlder) * (23 * 60 - 8 * 60)) + 8 * 60;
      const hourOlder = Math.floor(randomMinutesOlder / 60);
      const minuteOlder = randomMinutesOlder % 60;

      dateOlder.setHours(hourOlder, minuteOlder, 0, 0);
      return dateOlder;

    default:
      // Fallback to today if category is undefined or unknown
      const fallbackDate = new Date(today);
      fallbackDate.setHours(12, 0, 0, 0); // Set to noon as a neutral time
      return fallbackDate;
  }
}
