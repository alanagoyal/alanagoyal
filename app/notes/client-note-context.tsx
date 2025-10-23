"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Note } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

interface ClientNoteContextType {
  currentNote: Note | null;
  navigateToNote: (note: Note) => void;
  isLoading: boolean;
}

const ClientNoteContext = createContext<ClientNoteContextType | undefined>(undefined);

export function ClientNoteProvider({
  children,
  initialNote,
  publicNotes,
}: {
  children: React.ReactNode;
  initialNote: Note | null;
  publicNotes: Note[];
}) {
  const [currentNote, setCurrentNote] = useState<Note | null>(initialNote);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  // Fetch note from database if not in memory
  const fetchNote = useCallback(async (slug: string): Promise<Note | null> => {
    try {
      const { data: note } = await supabase
        .rpc("select_note", {
          note_slug_arg: slug,
        })
        .single() as { data: Note | null };
      return note;
    } catch (error) {
      console.error("Error fetching note:", error);
      return null;
    }
  }, [supabase]);

  // Sync with URL changes (for browser back/forward)
  useEffect(() => {
    const slug = pathname.split("/").pop();
    if (slug && currentNote?.slug !== slug) {
      setIsLoading(true);

      // Try to find in public notes first (fast)
      const publicNote = publicNotes.find((n) => n.slug === slug);
      if (publicNote) {
        setCurrentNote(publicNote);
        setIsLoading(false);
      } else {
        // Fetch from database if not public
        fetchNote(slug).then((note) => {
          if (note) {
            setCurrentNote(note);
          }
          setIsLoading(false);
        });
      }
    }
  }, [pathname, publicNotes, currentNote, fetchNote]);

  const navigateToNote = useCallback((note: Note) => {
    // Instantly update the displayed note
    setCurrentNote(note);

    // Update URL without triggering Next.js routing
    window.history.replaceState(null, "", `/notes/${note.slug}`);
  }, []);

  return (
    <ClientNoteContext.Provider value={{ currentNote, navigateToNote, isLoading }}>
      {children}
    </ClientNoteContext.Provider>
  );
}

export function useClientNote() {
  const context = useContext(ClientNoteContext);
  if (!context) {
    throw new Error("useClientNote must be used within ClientNoteProvider");
  }
  return context;
}
