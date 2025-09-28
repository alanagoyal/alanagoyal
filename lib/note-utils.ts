function getRandomDateInRange(startDate: Date, endDate: Date, seed: string): Date {
  // Create a simple hash from the seed to get a consistent "random" number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert hash to a value between 0 and 1
  const pseudoRandom = Math.abs(hash) / 2147483647;

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + pseudoRandom * (endTime - startTime);
  return new Date(randomTime);
}


export function groupNotesByCategory(notes: any[], pinnedNotes: Set<string>) {
  const groupedNotes: any = {
    pinned: [],
  };

  const now = new Date();

  notes.forEach((note) => {
    if (pinnedNotes.has(note.slug)) {
      groupedNotes.pinned.push(note);
      return;
    }

    let category = note.category;
    if (!note.public) {
      const createdDate = new Date(note.created_at);
      const today = new Date(now);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(now);
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

export function getDisplayDateForNote(note: any, category: string): string {
  if (note.public) {
    return note.created_at;
  }

  const now = new Date();
  let displayDate: Date;
  const seed = note.id || note.slug || note.created_at; // Use note ID as seed for consistency

  switch (category) {
    case "today":
      displayDate = new Date(now);
      break;
    case "yesterday":
      displayDate = new Date(now);
      displayDate.setDate(now.getDate() - 1);
      break;
    case "7":
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(now.getDate() - 2);
      displayDate = getRandomDateInRange(sevenDaysAgo, twoDaysAgo, seed);
      break;
    case "30":
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const eightDaysAgo = new Date(now);
      eightDaysAgo.setDate(now.getDate() - 8);
      displayDate = getRandomDateInRange(thirtyDaysAgo, eightDaysAgo, seed);
      break;
    case "older":
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      const thirtyOneDaysAgo = new Date(now);
      thirtyOneDaysAgo.setDate(now.getDate() - 31);
      displayDate = getRandomDateInRange(oneYearAgo, thirtyOneDaysAgo, seed);
      break;
    default:
      return note.created_at;
  }

  return displayDate.toISOString();
}
