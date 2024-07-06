import { Note } from "./types";

export function searchNotes(notes: Note[], searchTerm: string, sessionId: string): Note[] {
    const searchLower = searchTerm.toLowerCase();
    
    return notes.filter((note) => {
      const isPublic = note.public;
      const sessionMatch = note.session_id === sessionId; 
      const isAccessible = isPublic || sessionMatch;
      const titleMatch = note.title.toLowerCase().includes(searchLower);
      const contentMatch = note.content.toLowerCase().includes(searchLower);
      const matchesSearch = titleMatch || contentMatch;

      return isAccessible && matchesSearch;
    });
  }
