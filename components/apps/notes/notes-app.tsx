"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Note as NoteType } from "@/lib/notes/types";
import { SessionNotesProvider } from "@/app/(desktop)/notes/session-notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWindowFocus } from "@/lib/window-focus-context";
import Sidebar from "./sidebar";
import Note from "./note";

interface NotesAppProps {
  isMobile?: boolean;
  inShell?: boolean; // When true, use callback navigation instead of route navigation
  initialSlug?: string; // If provided, select this note on load
}

export function NotesApp({ isMobile = false, inShell = false, initialSlug }: NotesAppProps) {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const supabase = createClient();
  const windowFocus = useWindowFocus();
  // Container ref for scoping dialogs to this app (fallback when not in desktop shell)
  const containerRef = useRef<HTMLDivElement>(null);
  // Use window's dialog container when in desktop shell, otherwise use local ref
  const dialogContainer = windowFocus?.dialogContainerRef?.current ?? containerRef.current;

  // Fetch public notes on mount
  useEffect(() => {
    async function fetchNotes() {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("public", true)
        .order("created_at", { ascending: false });

      if (data) {
        setNotes(data);
        // On mobile without initialSlug, show sidebar only (no note selected)
        // On desktop or with initialSlug, select a note
        if (isMobile && !initialSlug) {
          // Don't auto-select a note on mobile - show sidebar only
          setLoading(false);
          return;
        }

        // Use initialSlug if provided, otherwise "about-me", otherwise first note
        const targetSlug = initialSlug || "about-me";
        const defaultNote = data.find((n: NoteType) => n.slug === targetSlug);

        if (defaultNote && !selectedNote) {
          // Note found in public notes - fetch full data
          const { data: fullNote } = await supabase
            .rpc("select_note", { note_slug_arg: defaultNote.slug })
            .single();
          if (fullNote) {
            setSelectedNote(fullNote as NoteType);
          }
        } else if (!defaultNote && initialSlug && !selectedNote) {
          // Note not in public notes - try to fetch directly (may be a private/session note)
          const { data: fullNote } = await supabase
            .rpc("select_note", { note_slug_arg: initialSlug })
            .single();
          if (fullNote) {
            setSelectedNote(fullNote as NoteType);
          } else {
            // Note doesn't exist - fall back to first public note and update URL
            const fallbackNote = data[0];
            if (fallbackNote) {
              const { data: fallbackFullNote } = await supabase
                .rpc("select_note", { note_slug_arg: fallbackNote.slug })
                .single();
              if (fallbackFullNote) {
                setSelectedNote(fallbackFullNote as NoteType);
                window.history.replaceState(null, "", `/notes/${fallbackNote.slug}`);
              }
            }
          }
        } else if (!selectedNote) {
          // No initialSlug provided and no note selected - use first note
          const fallbackNote = data[0];
          if (fallbackNote) {
            const { data: fullNote } = await supabase
              .rpc("select_note", { note_slug_arg: fallbackNote.slug })
              .single();
            if (fullNote) {
              setSelectedNote(fullNote as NoteType);
            }
          }
        }
      }
      setLoading(false);
    }
    fetchNotes();
  }, [supabase, initialSlug, isMobile]);

  const handleNoteSelect = useCallback(async (note: NoteType) => {
    // Fetch full note data using RPC
    const { data: fullNote } = await supabase
      .rpc("select_note", { note_slug_arg: note.slug })
      .single();
    if (fullNote) {
      setSelectedNote(fullNote as NoteType);
      // Update URL to reflect selected note
      window.history.replaceState(null, "", `/notes/${note.slug}`);
      // On mobile, hide sidebar when note is selected
      if (isMobile) {
        setShowSidebar(false);
      }
    }
  }, [supabase, isMobile]);

  const handleBackToSidebar = useCallback(() => {
    setShowSidebar(true);
    // Update URL when going back to sidebar on mobile
    if (isMobile) {
      window.history.replaceState(null, "", "/notes");
    }
  }, [isMobile]);

  // Handler for new note creation - sets note and updates URL
  const handleNoteCreated = useCallback((note: NoteType) => {
    setSelectedNote(note);
    // Update URL to reflect the new note
    window.history.replaceState(null, "", `/notes/${note.slug}`);
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [isMobile]);

  // Show empty background while loading to prevent flash
  if (loading) {
    return <div className="h-full bg-background" />;
  }

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
            <Sidebar
              notes={notes}
              onNoteSelect={handleNoteSelect}
              isMobile={true}
              selectedSlug={selectedNote?.slug}
              useCallbackNavigation
              onNoteCreated={handleNoteCreated}
            />
          ) : (
            <div className="h-full">
              {selectedNote && (
                <div className="h-full p-3">
                  <Note key={selectedNote.id} note={selectedNote} onBack={handleBackToSidebar} />
                </div>
              )}
            </div>
          )}
        </div>
      </SessionNotesProvider>
    );
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
          dialogContainer={dialogContainer}
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
