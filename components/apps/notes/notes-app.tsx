"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Note as NoteType } from "@/lib/notes/types";
import { SessionNotesProvider } from "@/app/(desktop)/notes/session-notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWindowFocus } from "@/lib/window-focus-context";
import { setUrl } from "@/lib/set-url";
import { loadNotesSelectedSlug, saveNotesSelectedSlug } from "@/lib/sidebar-persistence";
import { getNoteSlugFromShellPathname } from "@/lib/shell-routing";
import { getNotesSelectedSlugMemory, setNotesSelectedSlugMemory } from "@/lib/notes/selection-state";
import { groupNotesByCategory, sortGroupedNotes } from "@/lib/notes/note-utils";
import {
  withDisplayCreatedAt,
  withDisplayCreatedAtForNotes,
} from "@/lib/notes/display-created-at";
import Sidebar from "./sidebar";
import Note from "./note";
import { Icons } from "./icons";

// Module state survives Notes unmount/remount within a single page session.
// It resets on hard refresh/navigation.
let hasMountedNotesInPageSession = false;
const SIDEBAR_CATEGORY_ORDER = ["pinned", "today", "yesterday", "7", "30", "older"] as const;
type DesktopStartupMode = "first-mount" | "remount";

function getPinnedSlugsForFallback(notes: NoteType[]): Set<string> {
  const defaultPinned = new Set(
    notes
      .filter((note) => note.slug === "about-me" || note.slug === "quick-links")
      .map((note) => note.slug)
  );

  if (typeof window === "undefined") {
    return defaultPinned;
  }

  try {
    const raw = localStorage.getItem("pinnedNotes");
    if (!raw) return defaultPinned;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultPinned;
    return new Set(parsed.filter((slug): slug is string => typeof slug === "string"));
  } catch {
    return defaultPinned;
  }
}

function getTopmostNoteSlug(notes: NoteType[]): string | undefined {
  if (notes.length === 0) return undefined;

  const pinnedSlugs = getPinnedSlugsForFallback(notes);
  const grouped = groupNotesByCategory(notes, pinnedSlugs);
  sortGroupedNotes(grouped);

  for (const category of SIDEBAR_CATEGORY_ORDER) {
    const firstNote = grouped[category]?.[0];
    if (firstNote?.slug) return firstNote.slug;
  }

  return notes[0]?.slug;
}

interface NotesAppProps {
  isMobile?: boolean;
  inShell?: boolean; // When true, enables drag overlay for desktop window shell
  initialSlug?: string; // If provided, select this note on load
  initialNote?: NoteType;
}

export function NotesApp({ isMobile = false, inShell = false, initialSlug, initialNote }: NotesAppProps) {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [notesForFallback, setNotesForFallback] = useState<NoteType[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(
    initialNote ? withDisplayCreatedAt(initialNote) : null
  );
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const windowFocus = useWindowFocus();
  // Container ref for scoping dialogs to this app (fallback when not in desktop shell)
  const containerRef = useRef<HTMLDivElement>(null);
  // Track selected slug in a ref so async startup sync doesn't overwrite newer manual selection.
  const selectedSlugRef = useRef<string | undefined>(selectedNote?.slug);
  // Allows handleBackToSidebar to cancel in-flight sync fetches immediately,
  // without waiting for the effect cleanup to run on the next render.
  const syncCancelledRef = useRef(false);
  const desktopStartupModeRef = useRef<DesktopStartupMode | null>(null);
  const persistDesktopSelection = useCallback((slug: string) => {
    if (isMobile) return;
    setNotesSelectedSlugMemory(slug);
    saveNotesSelectedSlug(slug);
  }, [isMobile]);
  const resolveDesktopStartupMode = useCallback((): DesktopStartupMode => {
    if (desktopStartupModeRef.current) {
      return desktopStartupModeRef.current;
    }

    const mode: DesktopStartupMode = hasMountedNotesInPageSession ? "remount" : "first-mount";
    hasMountedNotesInPageSession = true;
    desktopStartupModeRef.current = mode;
    return mode;
  }, []);

  // Normalize preloaded notes to client-side display timestamps after mount.
  useEffect(() => {
    setSelectedNote((current) => (current ? withDisplayCreatedAt(current) : current));
  }, []);

  // Keep ref aligned with committed selected note state.
  useEffect(() => {
    selectedSlugRef.current = selectedNote?.slug;
    if (!isMobile && selectedNote?.slug) {
      persistDesktopSelection(selectedNote.slug);
    }
  }, [isMobile, persistDesktopSelection, selectedNote?.slug]);

  // Fetch public notes once.
  useEffect(() => {
    let cancelled = false;

    async function fetchNotes() {
      try {
        const sessionId =
          typeof window !== "undefined" ? localStorage.getItem("session_id") : null;

        const [publicResult, sessionResult] = await Promise.all([
          supabase
            .from("notes")
            .select("*")
            .eq("public", true)
            .order("created_at", { ascending: false }),
          sessionId
            ? supabase.rpc("select_session_notes", { session_id_arg: sessionId })
            : Promise.resolve({ data: [] as NoteType[] }),
        ]);

        if (cancelled) return;

        const publicNotes = ((publicResult.data as NoteType[] | null) ?? []);
        const sessionNotes = ((sessionResult.data as NoteType[] | null) ?? []);
        const allNotes = [...publicNotes, ...sessionNotes];
        const uniqueBySlug = new Map<string, NoteType>();
        for (const note of allNotes) {
          uniqueBySlug.set(note.slug, note);
        }

        setNotes(withDisplayCreatedAtForNotes(publicNotes));
        setNotesForFallback(withDisplayCreatedAtForNotes(Array.from(uniqueBySlug.values())));
      } catch (error) {
        console.error("Failed to fetch notes for sidebar/fallback selection:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchNotes();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Keep selected note in sync with route slug.
  useEffect(() => {
    const desktopStartupMode = isMobile ? null : resolveDesktopStartupMode();

    let cancelled = false;
    syncCancelledRef.current = false;

    const isCancelled = () => cancelled || syncCancelledRef.current;

    async function syncSelectedNote() {
      const routeSlug = getNoteSlugFromShellPathname(window.location.pathname);

      // Desktop should only use URL/persisted state for initial selection.
      // After a user picks a note, don't force-sync back during this mount.
      if (!isMobile && selectedSlugRef.current) {
        return;
      }

      // Mobile /notes should show the list view with no active note.
      if (isMobile && !routeSlug) {
        if (!loading) {
          setSelectedNote(null);
        }
        return;
      }

      const persistedSlug = isMobile ? null : loadNotesSelectedSlug();
      const memorySlug = isMobile ? null : getNotesSelectedSlugMemory();
      const fallbackSlug = getTopmostNoteSlug(
        notesForFallback.length > 0 ? notesForFallback : notes
      );
      const isFirstDesktopMount = desktopStartupMode === "first-mount";
      const targetSlug = isMobile
        ? (routeSlug || fallbackSlug)
        : (isFirstDesktopMount
          ? (routeSlug || memorySlug || persistedSlug || fallbackSlug)
          : (memorySlug || persistedSlug || fallbackSlug));

      if (!targetSlug) {
        if (!loading) {
          setSelectedNote(null);
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
      if (selectedSlugRef.current && selectedSlugRef.current !== targetSlug) {
        return;
      }

      if (fullNote) {
        selectedSlugRef.current = targetSlug;
        persistDesktopSelection(targetSlug);
        setSelectedNote(withDisplayCreatedAt(fullNote as NoteType));
        if (!isMobile) {
          const expectedPath = `/notes/${encodeURIComponent(targetSlug)}`;
          if (window.location.pathname !== expectedPath) {
            setUrl(expectedPath);
          }
        }
        return;
      }

      if (loading) {
        return;
      }

      // If slug is invalid, recover to a valid note URL when possible.
      if (routeSlug && fallbackSlug && fallbackSlug !== targetSlug) {
        const { data: fallbackFullNote } = await supabase
          .rpc("select_note", { note_slug_arg: fallbackSlug })
          .single();

        if (isCancelled()) return;
        if (selectedSlugRef.current && selectedSlugRef.current !== fallbackSlug) {
          return;
        }

        if (fallbackFullNote) {
          selectedSlugRef.current = fallbackSlug;
          persistDesktopSelection(fallbackSlug);
          setSelectedNote(withDisplayCreatedAt(fallbackFullNote as NoteType));
          setUrl(`/notes/${encodeURIComponent(fallbackSlug)}`);
          return;
        }
      }

      setSelectedNote(null);
      if (routeSlug) {
        setUrl("/notes");
      }
    }

    syncSelectedNote();

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    isMobile,
    notes,
    notesForFallback,
    persistDesktopSelection,
    resolveDesktopStartupMode,
    supabase,
  ]);

  const handleNoteSelect = useCallback(async (note: NoteType) => {
    selectedSlugRef.current = note.slug;
    persistDesktopSelection(note.slug);
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
  }, [persistDesktopSelection, supabase]);

  const handleBackToSidebar = useCallback(() => {
    // Cancel any in-flight sync fetch so it doesn't override the back navigation.
    syncCancelledRef.current = true;
    selectedSlugRef.current = undefined;
    setSelectedNote(null);
    if (isMobile) {
      setUrl("/notes");
    }
  }, [isMobile]);

  // Handler for new note creation - sets note and updates URL
  const handleNoteCreated = useCallback((note: NoteType) => {
    selectedSlugRef.current = note.slug;
    persistDesktopSelection(note.slug);
    setSelectedNote(withDisplayCreatedAt(note));
    // Update URL to reflect the new note
    setUrl(`/notes/${note.slug}`);
  }, [persistDesktopSelection]);

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
