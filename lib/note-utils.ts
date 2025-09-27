function getRandomDateInRange(startDate: Date, endDate: Date): Date {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

function syncNoteDateWithCategory(note: any, category: string): any {
  if (note.public) {
    return note;
  }

  const now = new Date();

  let newDate: Date;

  switch (category) {
    case "today":
      newDate = new Date(now);
      break;
    case "yesterday":
      newDate = new Date(now);
      newDate.setDate(now.getDate() - 1);
      break;
    case "7":
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(now.getDate() - 2);
      newDate = getRandomDateInRange(sevenDaysAgo, twoDaysAgo);
      break;
    case "30":
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const eightDaysAgo = new Date(now);
      eightDaysAgo.setDate(now.getDate() - 8);
      newDate = getRandomDateInRange(thirtyDaysAgo, eightDaysAgo);
      break;
    case "older":
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      const thirtyOneDaysAgo = new Date(now);
      thirtyOneDaysAgo.setDate(now.getDate() - 31);
      newDate = getRandomDateInRange(oneYearAgo, thirtyOneDaysAgo);
      break;
    default:
      return note;
  }

  return {
    ...note,
    created_at: newDate.toISOString()
  };
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

    const syncedNote = syncNoteDateWithCategory(note, category);

    if (!groupedNotes[category]) {
      groupedNotes[category] = [];
    }
    groupedNotes[category].push(syncedNote);
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

export async function syncNoteDatesWithDatabase(notes: any[], pinnedNotes: Set<string>, sessionId: string, supabase: any) {
  const userSpecificNotes = notes.filter(
    (note) => !note.public && note.session_id === sessionId
  );

  for (const note of userSpecificNotes) {
    if (pinnedNotes.has(note.slug)) {
      continue; // Skip pinned notes
    }

    let category = note.category;
    const createdDate = new Date(note.created_at);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (createdDate.toDateString() === now.toDateString()) {
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

    const syncedNote = syncNoteDateWithCategory(note, category);

    if (syncedNote.created_at !== note.created_at) {
      try {
        await supabase.rpc("update_note_date", {
          uuid_arg: note.id,
          session_arg: sessionId,
          created_at_arg: syncedNote.created_at,
        });
        console.log(`Updated note ${note.slug} date to ${syncedNote.created_at}`);
      } catch (error) {
        console.error(`Failed to update note ${note.slug}:`, error);
      }
    }
  }
}
