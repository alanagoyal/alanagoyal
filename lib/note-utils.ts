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
    console.log(`🔶 groupNotesByCategory: Note ${note.slug}, original category=${note.category}, public=${note.public}, created_at=${note.created_at}`);

    if (!note.public) {
      const createdDate = new Date(note.created_at);
      const today = new Date(now);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      console.log(`🔶 Date comparison: created=${createdDate.toDateString()}, today=${today.toDateString()}, yesterday=${yesterday.toDateString()}`);

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

      console.log(`🔶 Final calculated category: ${category}`);
    } else {
      console.log(`🔶 Public note, keeping original category: ${category}`);
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
  console.log(`🔸 getDisplayDateForNote called: note=${note.slug}, category=${category}, public=${note.public}`);

  if (note.public) {
    console.log(`🔸 Public note, returning original date: ${note.created_at}`);
    return note.created_at;
  }

  const now = new Date();
  let displayDate: Date;
  const seed = note.id || note.slug || note.created_at; // Use note ID as seed for consistency

  console.log(`🔸 Current date: ${now.toISOString()}, seed: ${seed}`);

  switch (category) {
    case "today":
      displayDate = new Date(now);
      console.log(`🔸 Today category, using current date: ${displayDate.toISOString()}`);
      break;
    case "yesterday":
      displayDate = new Date(now);
      displayDate.setDate(now.getDate() - 1);
      console.log(`🔸 Yesterday category, using: ${displayDate.toISOString()}`);
      break;
    case "7":
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(now.getDate() - 2);
      displayDate = getRandomDateInRange(sevenDaysAgo, twoDaysAgo, seed);
      console.log(`🔸 7 days category, using random date: ${displayDate.toISOString()}`);
      break;
    case "30":
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const eightDaysAgo = new Date(now);
      eightDaysAgo.setDate(now.getDate() - 8);
      displayDate = getRandomDateInRange(thirtyDaysAgo, eightDaysAgo, seed);
      console.log(`🔸 30 days category, using random date: ${displayDate.toISOString()}`);
      break;
    case "older":
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      const thirtyOneDaysAgo = new Date(now);
      thirtyOneDaysAgo.setDate(now.getDate() - 31);
      displayDate = getRandomDateInRange(oneYearAgo, thirtyOneDaysAgo, seed);
      console.log(`🔸 Older category, using random date: ${displayDate.toISOString()}`);
      break;
    default:
      console.log(`🔸 Unknown category ${category}, returning original date: ${note.created_at}`);
      return note.created_at;
  }

  const result = displayDate.toISOString();
  console.log(`🔸 Final display date: ${result}`);
  return result;
}
