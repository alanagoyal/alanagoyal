export interface Note {
  id: string;
  slug: string;
  title: string;
  content: string;
  created_at: string;
  display_created_at?: string;
  session_id: string | null;
  emoji?: string;
  public: boolean;
  category?: string;
}

export type NotesViewMode = "list" | "gallery";

export type NotesSortField = "default" | "edited" | "created" | "title";

export type NotesSortDirection = "newest" | "oldest";

export type NotesGroupMode = "edited" | "created" | "off";
