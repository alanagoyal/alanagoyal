"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Note as NoteType } from "@/lib/notes/types";
import { SessionNotesProvider } from "@/app/(desktop)/notes/session-notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWindowFocus } from "@/lib/window-focus-context";
import { setUrl } from "@/lib/set-url";
import {
  withDisplayCreatedAt,
  withDisplayCreatedAtForNotes,
} from "@/lib/notes/display-created-at";
import {
  NOTES_RESET_TO_FIRST_EVENT,
  consumeNotesResetToFirstFlag,
} from "@/lib/sidebar-persistence";
import Sidebar from "./sidebar";
import Note from "./note";
import { Icons } from "./icons";

interface NotesAppProps {
  isMobile?: boolean;
  inShell?: boolean; // When true, enables drag overlay for desktop window shell
  initialSlug?: string; // If provided, select this note on load
  initialNote?: NoteType;
}

export function NotesApp({ isMobile = false, inShell = false, initialSlug, initialNote }: NotesAppProps) {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(
    initialNote ? withDisplayCreatedAt(initialNote) : null
  );
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const windowFocus = useWindowFocus();
  // Container ref for scoping dialogs to this app (fallback when not in desktop shell)
  const containerRef = useRef<HTMLDivElement>(null);
  // Track selected slug in a ref so the sync effect can read it without re-triggering.
  const selectedSlugRef = useRef(selectedNote?.slug);
  selectedSlugRef.current = selectedNote?.slug;
  // Allows handleBackToSidebar to cancel in-flight sync fetches immediately,
  // without waiting for the effect cleanup to run on the next render.
  const syncCancelledRef = useRef(false);
  const forceFirstNoteRef = useRef(false);

  const requestFirstNoteReset = useCallback(() => {
    syncCancelledRef.current = true;
    forceFirstNoteRef.current = true;
    setSelectedNote(null);
    setSelectionResetKey((current) => current + 1);
  }, []);

  // Normalize preloaded notes to client-side display timestamps after mount.
  useEffect(() => {
    setSelectedNote((current) => (current ? withDisplayCreatedAt(current) : current));
  }, []);

  // Fetch public notes once.
  useEffect(() => {
    let cancelled = false;

    async function fetchNotes() {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("public", true)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      setNotes(withDisplayCreatedAtForNotes(((data as NoteType[] | null) ?? [])));
      setLoading(false);
    }

    fetchNotes();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (isMobile || typeof window === "undefined") return;

    if (consumeNotesResetToFirstFlag()) {
      requestFirstNoteReset();
    }

    const handleNotesReset = () => {
      if (consumeNotesResetToFirstFlag()) {
        requestFirstNoteReset();
      }
    };

    window.addEventListener(NOTES_RESET_TO_FIRST_EVENT, handleNotesReset);
    return () => {
      window.removeEventListener(NOTES_RESET_TO_FIRST_EVENT, handleNotesReset);
    };
  }, [isMobile, requestFirstNoteReset]);

  // Keep selected note in sync with route slug.
  useEffect(() => {
    let cancelled = false;
    syncCancelledRef.current = false;

    const isCancelled = () => cancelled || syncCancelledRef.current;

    async function syncSelectedNote() {
      // Desktop should use initialSlug only for initial selection.
      // After a user picks a note, don't force-sync back to initialSlug.
      if (!isMobile && selectedSlugRef.current) {
        return;
      }

      // Mobile /notes should show the list view with no active note.
      if (isMobile && !initialSlug) {
        if (!loading) {
          setSelectedNote(null);
        }
        return;
      }

      const fallbackSlug = notes.find((note) => note.slug === "about-me")?.slug ?? notes[0]?.slug;
      const shouldForceFirstNote = !isMobile && forceFirstNoteRef.current;
      const targetSlug = shouldForceFirstNote ? fallbackSlug : (initialSlug || fallbackSlug);

      if (!targetSlug) {
        if (!loading) {
          setSelectedNote(null);
          if (shouldForceFirstNote) {
            forceFirstNoteRef.current = false;
          }
        }
        return;
      }

      if (selectedSlugRef.current === targetSlug) {
        return;
      }

      const { data: fullNote } = await supabase
        .rpc("select_note", { note_slug_arg: targetSlug })
        .single();

      if (isCancelled()) return;

      if (fullNote) {
        setSelectedNote(withDisplayCreatedAt(fullNote as NoteType));
        if (shouldForceFirstNote) {
          forceFirstNoteRef.current = false;
          setUrl(`/notes/${targetSlug}`);
        }
        return;
      }

      if (loading) {
        return;
      }

      // If slug is invalid, recover to a valid note URL when possible.
      if (initialSlug && !shouldForceFirstNote && fallbackSlug && fallbackSlug !== targetSlug) {
        const { data: fallbackFullNote } = await supabase
          .rpc("select_note", { note_slug_arg: fallbackSlug })
          .single();

        if (isCancelled()) return;

        if (fallbackFullNote) {
          setSelectedNote(withDisplayCreatedAt(fallbackFullNote as NoteType));
          setUrl(`/notes/${fallbackSlug}`);
          return;
        }
      }

      setSelectedNote(null);
      if (initialSlug && !shouldForceFirstNote) {
        setUrl("/notes");
      }
      if (shouldForceFirstNote) {
        forceFirstNoteRef.current = false;
      }
    }

    syncSelectedNote();

    return () => {
      cancelled = true;
    };
  }, [loading, isMobile, initialSlug, notes, selectionResetKey, supabase]);

  const handleNoteSelect = useCallback(async (note: NoteType) => {
    // Update URL and UI immediately on selection.
    setUrl(`/notes/${note.slug}`);
    setSelectedNote(withDisplayCreatedAt(note));

    // Fetch full note data using RPC.
    const { data: fullNote } = await supabase
      .rpc("select_note", { note_slug_arg: note.slug })
      .single();

    if (fullNote) {
      // Guard against stale async responses when users switch notes quickly.
      setSelectedNote((current) => (
        current?.slug === note.slug
          ? withDisplayCreatedAt(fullNote as NoteType)
          : current
      ));
    }
  }, [supabase]);

  const handleBackToSidebar = useCallback(() => {
    // Cancel any in-flight sync fetch so it doesn't override the back navigation.
    syncCancelledRef.current = true;
    setSelectedNote(null);
    if (isMobile) {
      setUrl("/notes");
    }
  }, [isMobile]);

  // Handler for new note creation - sets note and updates URL
  const handleNoteCreated = useCallback((note: NoteType) => {
    setSelectedNote(withDisplayCreatedAt(note));
    // Update URL to reflect the new note
    setUrl(`/notes/${note.slug}`);
  }, []);

  const showSidebar = isMobile && !initialSlug;

  // On mobile, show either sidebar or note content
  if (isMobile) {
    return (
      <SessionNotesProvider>
        <div
          ref={containerRef}
          data-app="notes"
          tabIndex={-1}
          onMouseDown={() => containerRef.current?.focus()}
          className="notes-app h-full bg-background text-foreground outline-none"
        >
          {showSidebar ? (
            loading ? (
              <div className="h-full bg-background" />
            ) : (
              <Sidebar
                notes={notes}
                onNoteSelect={handleNoteSelect}
                isMobile={true}
                selectedSlug={selectedNote?.slug}
                useCallbackNavigation
                onNoteCreated={handleNoteCreated}
              />
            )
          ) : (
            <div className="h-full">
              {selectedNote && (
                <div className="h-full p-3">
                  <Note key={selectedNote.id} note={selectedNote} isMobile={isMobile} onBack={handleBackToSidebar} />
                </div>
              )}
              {!selectedNote && (
                <div className="h-full p-3">
                  <button onClick={handleBackToSidebar} className="pt-2 flex items-center">
                    <Icons.back />
                    <span className="text-[#e2a727] text-base ml-1">Notes</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </SessionNotesProvider>
    );
  }

  // Show empty background while loading to prevent flash on desktop
  if (loading) {
    return <div className="h-full bg-background" />;
  }

  // Desktop view - show both sidebar and note
  return (
    <SessionNotesProvider>
      <div
        ref={containerRef}
        data-app="notes"
        tabIndex={-1}
        onMouseDown={() => containerRef.current?.focus()}
        className="notes-app h-full flex bg-background text-foreground relative outline-none"
      >
            <Sidebar
              notes={notes}
              onNoteSelect={handleNoteSelect}
              isMobile={false}
              selectedSlug={selectedNote?.slug}
              useCallbackNavigation
              onNoteCreated={handleNoteCreated}
            />
        <div className="flex-grow h-full overflow-hidden relative">
          {/* Drag overlay - matches nav height, doesn't affect layout */}
          {inShell && windowFocus && (
            <div
              className="absolute top-0 left-0 right-0 h-[52px] z-10 select-none"
              onMouseDown={(e) => {
                const overlay = e.currentTarget as HTMLElement;
                const startX = e.clientX;
                const startY = e.clientY;
                let didDrag = false;

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const dx = Math.abs(moveEvent.clientX - startX);
                  const dy = Math.abs(moveEvent.clientY - startY);
                  if (!didDrag && (dx > 5 || dy > 5)) {
                    didDrag = true;
                    windowFocus.onDragStart(e);
                  }
                };

                const handleMouseUp = (upEvent: MouseEvent) => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);

                  if (!didDrag) {
                    // It was a click - find and click the element below
                    overlay.style.pointerEvents = 'none';
                    const elementBelow = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
                    overlay.style.pointerEvents = '';
                    if (elementBelow && elementBelow !== overlay) {
                      (elementBelow as HTMLElement).click();
                    }
                  }
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          )}
          <ScrollArea className="h-full" isMobile={false} bottomMargin="0px">
            {selectedNote ? (
              <div className="w-full min-h-full p-3">
                <Note key={selectedNote.id} note={selectedNote} isMobile={false} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a note</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </SessionNotesProvider>
  );
}
