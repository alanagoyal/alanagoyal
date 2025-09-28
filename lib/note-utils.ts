export function groupNotesByCategory(notes: any[], pinnedNotes: Set<string>) {
  const groupedNotes: any = {
    pinned: [],
  };

  notes.forEach((note) => {
    if (pinnedNotes.has(note.slug)) {
      groupedNotes.pinned.push(note);
      return;
    }

    let category = note.category;
    if (!note.public) {
      const createdDate = new Date(note.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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

export function sortGroupedNotes(groupedNotes: any) {
  Object.keys(groupedNotes).forEach((category) => {
    groupedNotes[category].sort((a: any, b: any) =>
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
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Seeded random function
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getDisplayDateByCategory(category: string | undefined, noteId: string): Date {
  const today = new Date();

  switch (category) {
    case "today":
      return today;

    case "yesterday":
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;

    case "7":
      // Deterministic "random" date 2-7 days ago based on note ID
      const seed7 = simpleHash(noteId + "7days");
      const daysAgo7 = Math.floor(seededRandom(seed7) * 6) + 2; // Between 2-7
      const date7 = new Date(today);
      date7.setDate(date7.getDate() - daysAgo7);
      return date7;

    case "30":
      // Deterministic "random" date 8-30 days ago based on note ID
      const seed30 = simpleHash(noteId + "30days");
      const daysAgo30 = Math.floor(seededRandom(seed30) * 23) + 8; // Between 8-30
      const date30 = new Date(today);
      date30.setDate(date30.getDate() - daysAgo30);
      return date30;

    case "older":
      // Deterministic "random" date 31-365 days ago based on note ID
      const seedOlder = simpleHash(noteId + "older");
      const daysAgoOlder = Math.floor(seededRandom(seedOlder) * 335) + 31; // Between 31-365
      const dateOlder = new Date(today);
      dateOlder.setDate(dateOlder.getDate() - daysAgoOlder);
      return dateOlder;

    default:
      // Fallback to today if category is undefined or unknown
      return today;
  }
}
