"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Note as NoteType } from "@/lib/notes/types";
import { SessionNotesProvider } from "@/app/(desktop)/notes/session-notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWindowFocus } from "@/lib/window-focus-context";
import { setUrl } from "@/lib/set-url";
import Sidebar from "./sidebar";
import Note from "./note";

interface NotesAppProps {
  isMobile?: boolean;
  inShell?: boolean; // When true, use callback navigation instead of route navigation
  initialSlug?: string; // If provided, select this note on load
  initialNote?: NoteType;
}

export function NotesApp({ isMobile = false, inShell = false, initialSlug, initialNote }: NotesAppProps) {
  const isRouteDrivenMobile = isMobile && !inShell;
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(initialNote ?? null);
  const [loading, setLoading] = useState(() => !(isRouteDrivenMobile && Boolean(initialSlug) && Boolean(initialNote)));
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const windowFocus = useWindowFocus();
  // Container ref for scoping dialogs to this app (fallback when not in desktop shell)
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingSelectionSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialNote) return;
    setSelectedNote(initialNote);
    setLoading(false);
  }, [initialNote]);

  // Fetch public notes on mount
  useEffect(() => {
    let isCancelled = false;

    async function fetchNotes() {
      if (isRouteDrivenMobile && initialSlug && initialNote?.slug === initialSlug) {
        setSelectedNote(initialNote);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("public", true)
        .order("created_at", { ascending: false });

      if (isCancelled) return;

      if (data) {
        setNotes(data);

        // On mobile without initialSlug, show sidebar only (no note selected)
        // On desktop or with initialSlug, select a note
        if (isMobile && !initialSlug) {
          // In mobile list route (/notes), no note is selected.
          setSelectedNote(null);
          setLoading(false);
          return;
        }

        // Use initialSlug if provided, otherwise "about-me", otherwise first note
        const targetSlug = initialSlug || "about-me";
        const defaultNote = data.find((n: NoteType) => n.slug === targetSlug);

        if (defaultNote) {
          // Note found in public notes - fetch full data
          const { data: fullNote } = await supabase
            .rpc("select_note", { note_slug_arg: defaultNote.slug })
            .single();
          if (isCancelled) return;

          if (fullNote) {
            setSelectedNote(fullNote as NoteType);
          } else {
            setSelectedNote(defaultNote);
          }
        } else if (!defaultNote && initialSlug) {
          // Note not in public notes - try to fetch directly (may be a private/session note)
          const { data: fullNote } = await supabase
            .rpc("select_note", { note_slug_arg: initialSlug })
            .single();
          if (isCancelled) return;

          if (fullNote) {
            setSelectedNote(fullNote as NoteType);
          } else {
            // Note doesn't exist - fall back to first public note and update URL
            const fallbackNote = data[0];
            if (fallbackNote) {
              const { data: fallbackFullNote } = await supabase
                .rpc("select_note", { note_slug_arg: fallbackNote.slug })
                .single();
              if (isCancelled) return;

              if (fallbackFullNote) {
                setSelectedNote(fallbackFullNote as NoteType);
              } else {
                setSelectedNote(fallbackNote);
              }
              if (isRouteDrivenMobile) {
                router.replace(`/notes/${fallbackNote.slug}`);
              } else {
                setUrl(`/notes/${fallbackNote.slug}`);
              }
            }
          }
        } else {
          // No initialSlug provided and no note selected - use first note
          const fallbackNote = data[0];
          if (fallbackNote) {
            const { data: fullNote } = await supabase
              .rpc("select_note", { note_slug_arg: fallbackNote.slug })
              .single();
            if (isCancelled) return;

            if (fullNote) {
              setSelectedNote(fullNote as NoteType);
            } else {
              setSelectedNote(fallbackNote);
            }
          }
        }
      }

      if (!isCancelled) {
        setLoading(false);
      }
    }

    fetchNotes();
    return () => {
      isCancelled = true;
    };
  }, [supabase, initialSlug, isMobile, isRouteDrivenMobile, initialNote, router]);

  const handleNoteSelect = useCallback(async (note: NoteType) => {
    pendingSelectionSlugRef.current = note.slug;
    if (isRouteDrivenMobile) {
      router.push(`/notes/${note.slug}`);
      return;
    }

    setSelectedNote(note);
    setUrl(`/notes/${note.slug}`);

    // Fetch full note data using RPC
    const { data: fullNote } = await supabase
      .rpc("select_note", { note_slug_arg: note.slug })
      .single();
    if (fullNote && pendingSelectionSlugRef.current === note.slug) {
      setSelectedNote(fullNote as NoteType);
    }
  }, [supabase, isRouteDrivenMobile, router]);

  const handleBackToSidebar = useCallback(() => {
    pendingSelectionSlugRef.current = null;
    if (isRouteDrivenMobile) {
      router.push("/notes");
      return;
    }
    // Legacy mobile-in-place mode fallback.
    if (isMobile) setUrl("/notes");
  }, [isMobile, isRouteDrivenMobile, router]);

  // Handler for new note creation - sets note and updates URL
  const handleNoteCreated = useCallback((note: NoteType) => {
    pendingSelectionSlugRef.current = note.slug;
    if (isRouteDrivenMobile) {
      router.push(`/notes/${note.slug}`);
      return;
    }

    setSelectedNote(note);
    // Update URL to reflect the new note
    setUrl(`/notes/${note.slug}`);
  }, [isRouteDrivenMobile, router]);

  // Show empty background while loading to prevent flash
  if (loading) {
    return <div className="h-full bg-background" />;
  }

  // On mobile, show either sidebar or note content
  if (isMobile) {
    const showSidebar = !initialSlug;
    const noteToRender = initialNote?.slug === initialSlug ? initialNote : selectedNote;

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
              {noteToRender && (
                <div className="h-full p-3">
                  <Note key={noteToRender.id} note={noteToRender} onBack={handleBackToSidebar} isMobile={true} />
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
