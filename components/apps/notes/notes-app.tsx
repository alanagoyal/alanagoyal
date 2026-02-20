"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Note as NoteType } from "@/lib/notes/types";
import { SessionNotesProvider } from "@/app/(desktop)/notes/session-notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWindowFocus } from "@/lib/window-focus-context";
import { setUrl } from "@/lib/set-url";
import Sidebar from "./sidebar";
import Note from "./note";
import { Icons } from "./icons";

interface NotesAppProps {
  isMobile?: boolean;
  inShell?: boolean; // When true, use callback navigation instead of route navigation
  initialSlug?: string; // If provided, select this note on load
  initialNote?: NoteType;
}

export function NotesApp({ isMobile = false, inShell = false, initialSlug, initialNote }: NotesAppProps) {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(initialNote ?? null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const windowFocus = useWindowFocus();
  // Container ref for scoping dialogs to this app (fallback when not in desktop shell)
  const containerRef = useRef<HTMLDivElement>(null);

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

      setNotes(data ?? []);
      setLoading(false);
    }

    fetchNotes();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Keep selected note in sync with route slug.
  useEffect(() => {
    let cancelled = false;

    async function syncSelectedNote() {
      // Desktop should use initialSlug only for initial selection.
      // After a user picks a note, don't force-sync back to initialSlug.
      if (!isMobile && selectedNote?.slug) {
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
      const targetSlug = initialSlug || fallbackSlug;

      if (!targetSlug) {
        if (!loading) {
          setSelectedNote(null);
        }
        return;
      }

      if (selectedNote?.slug === targetSlug) {
        return;
      }

      const { data: fullNote } = await supabase
        .rpc("select_note", { note_slug_arg: targetSlug })
        .single();

      if (cancelled) return;

      if (fullNote) {
        setSelectedNote(fullNote as NoteType);
        return;
      }

      if (loading) {
        return;
      }

      // If slug is invalid, recover to a valid note URL when possible.
      if (initialSlug && fallbackSlug && fallbackSlug !== targetSlug) {
        const { data: fallbackFullNote } = await supabase
          .rpc("select_note", { note_slug_arg: fallbackSlug })
          .single();

        if (cancelled) return;

        if (fallbackFullNote) {
          setSelectedNote(fallbackFullNote as NoteType);
          setUrl(`/notes/${fallbackSlug}`);
          return;
        }
      }

      setSelectedNote(null);
      if (initialSlug) {
        setUrl("/notes");
      }
    }

    syncSelectedNote();

    return () => {
      cancelled = true;
    };
  }, [loading, isMobile, initialSlug, notes, selectedNote?.slug, supabase]);

  const handleNoteSelect = useCallback(async (note: NoteType) => {
    // Update URL and UI immediately on selection.
    setUrl(`/notes/${note.slug}`);
    setSelectedNote(note);

    // Fetch full note data using RPC.
    const { data: fullNote } = await supabase
      .rpc("select_note", { note_slug_arg: note.slug })
      .single();

    if (fullNote) {
      // Guard against stale async responses when users switch notes quickly.
      setSelectedNote((current) => (
        current?.slug === note.slug ? (fullNote as NoteType) : current
      ));
    }
  }, [supabase]);

  const handleBackToSidebar = useCallback(() => {
    // Update URL when going back to sidebar on mobile
    if (isMobile) {
      setUrl("/notes");
    }
  }, [isMobile]);

  // Handler for new note creation - sets note and updates URL
  const handleNoteCreated = useCallback((note: NoteType) => {
    setSelectedNote(note);
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
                  <Note key={selectedNote.id} note={selectedNote} onBack={handleBackToSidebar} />
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
                <Note key={selectedNote.id} note={selectedNote} />
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
