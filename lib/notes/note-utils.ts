import { Note } from "@/lib/notes/types";

export type GroupedNotes = Record<string, Note[]>;
export const NOTE_SIDEBAR_CATEGORY_ORDER = [
  "pinned",
  "today",
  "yesterday",
  "7",
  "30",
  "older",
] as const;

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

export function flattenGroupedNotesBySidebarOrder(groupedNotes: GroupedNotes): Note[] {
  return NOTE_SIDEBAR_CATEGORY_ORDER.flatMap((category) => groupedNotes[category] ?? []);
}

export function getTopSidebarNote(
  notes: Note[],
  pinnedNotes: Set<string>,
  sessionId: string
): Note | null {
  const userSpecificNotes = notes.filter(
    (note) => note.public || note.session_id === sessionId
  );
  const groupedNotes = groupNotesByCategory(userSpecificNotes, pinnedNotes);
  sortGroupedNotes(groupedNotes);
  return flattenGroupedNotesBySidebarOrder(groupedNotes)[0] ?? null;
}
