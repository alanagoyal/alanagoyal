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

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
}

export function getDisplayDate(note: any, pinnedNotes: Set<string>): Date {
  if (pinnedNotes.has(note.slug)) {
    return new Date(note.created_at);
  }

  if (note.public) {
    return new Date(note.created_at);
  }

  const now = new Date();
  const createdDate = new Date(note.created_at);
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let category: string;
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

  switch (category) {
    case "today":
      return new Date(now);

    case "yesterday":
      return new Date(yesterday);

    case "7": {
      const minDays = 2;
      const maxDays = 7;
      const seed = note.slug + note.id + "7days";
      const randomValue = seededRandom(seed);
      const randomDays = Math.floor(randomValue * (maxDays - minDays + 1)) + minDays;
      const randomDate = new Date(now);
      randomDate.setDate(randomDate.getDate() - randomDays);
      return randomDate;
    }

    case "30": {
      const minDays = 8;
      const maxDays = 30;
      const seed = note.slug + note.id + "30days";
      const randomValue = seededRandom(seed);
      const randomDays = Math.floor(randomValue * (maxDays - minDays + 1)) + minDays;
      const randomDate = new Date(now);
      randomDate.setDate(randomDate.getDate() - randomDays);
      return randomDate;
    }

    case "older": {
      const minDays = 31;
      const maxDays = 365;
      const seed = note.slug + note.id + "older";
      const randomValue = seededRandom(seed);
      const randomDays = Math.floor(randomValue * (maxDays - minDays + 1)) + minDays;
      const randomDate = new Date(now);
      randomDate.setDate(randomDate.getDate() - randomDays);
      return randomDate;
    }

    default:
      return new Date(note.created_at);
  }
}
