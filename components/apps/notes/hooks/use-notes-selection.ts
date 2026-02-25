"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Note as NoteType } from "@/lib/notes/types";
import { loadNotesSelectedSlug, saveNotesSelectedSlug } from "@/lib/sidebar-persistence";
import {
  getNoteSlugFromShellPathname,
  SHELL_NOTES_ROOT_PATH,
} from "@/lib/shell-routing";
import { setUrl } from "@/lib/set-url";
import {
  getNotesSelectedSlugMemory,
  setNotesSelectedSlugMemory,
} from "@/lib/notes/selection-state";
import { groupNotesByCategory, sortGroupedNotes } from "@/lib/notes/note-utils";
import {
  withDisplayCreatedAt,
} from "@/lib/notes/display-created-at";

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

function isNotesRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === SHELL_NOTES_ROOT_PATH ||
    pathname.startsWith(`${SHELL_NOTES_ROOT_PATH}/`)
  );
}

interface UseNotesSelectionArgs {
  initialNote?: NoteType;
  isMobile: boolean;
  isWindowFocused: boolean;
  loading: boolean;
  notes: NoteType[];
  notesForFallback: NoteType[];
  supabase: ReturnType<typeof createClient>;
}

export function useNotesSelection({
  initialNote,
  isMobile,
  isWindowFocused,
  loading,
  notes,
  notesForFallback,
  supabase,
}: UseNotesSelectionArgs) {
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(
    initialNote ? withDisplayCreatedAt(initialNote) : null
  );
  const selectedSlugRef = useRef<string | undefined>(selectedNote?.slug);
  const syncCancelledRef = useRef(false);
  const desktopStartupModeRef = useRef<DesktopStartupMode | null>(null);

  const canUpdateNotesUrl = useCallback(() => {
    if (isWindowFocused) return true;
    if (typeof window === "undefined") return false;
    return isNotesRoute(window.location.pathname);
  }, [isWindowFocused]);

  const safeSetNotesUrl = useCallback((url: string) => {
    if (canUpdateNotesUrl()) {
      setUrl(url);
    }
  }, [canUpdateNotesUrl]);

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

  useEffect(() => {
    setSelectedNote((current) => (current ? withDisplayCreatedAt(current) : current));
  }, []);

  useEffect(() => {
    const slug = selectedNote?.slug;
    selectedSlugRef.current = slug;
    if (!isMobile && slug) {
      persistDesktopSelection(slug);
    }
  }, [isMobile, persistDesktopSelection, selectedNote]);

  useEffect(() => {
    const desktopStartupMode = isMobile ? null : resolveDesktopStartupMode();

    let cancelled = false;
    syncCancelledRef.current = false;

    const isCancelled = () => cancelled || syncCancelledRef.current;

    async function syncSelectedNote() {
      const routeSlug = getNoteSlugFromShellPathname(window.location.pathname);

      if (!isMobile && selectedSlugRef.current) {
        return;
      }

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
            safeSetNotesUrl(expectedPath);
          }
        }
        return;
      }

      if (loading) {
        return;
      }

      if (fallbackSlug && fallbackSlug !== targetSlug) {
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
          safeSetNotesUrl(`/notes/${encodeURIComponent(fallbackSlug)}`);
          return;
        }
      }

      setSelectedNote(null);
      if (routeSlug) {
        safeSetNotesUrl("/notes");
      }
    }

    syncSelectedNote();

    return () => {
      cancelled = true;
    };
  }, [
    isMobile,
    loading,
    notes,
    notesForFallback,
    persistDesktopSelection,
    resolveDesktopStartupMode,
    safeSetNotesUrl,
    supabase,
  ]);

  const handleNoteSelect = useCallback(async (note: NoteType) => {
    selectedSlugRef.current = note.slug;
    persistDesktopSelection(note.slug);
    setUrl(`/notes/${note.slug}`);
    setSelectedNote(withDisplayCreatedAt(note));

    const { data: fullNote } = await supabase
      .rpc("select_note", { note_slug_arg: note.slug })
      .single();

    if (fullNote) {
      setSelectedNote((current) => (
        current?.slug === note.slug
          ? withDisplayCreatedAt(fullNote as NoteType)
          : current
      ));
    }
  }, [persistDesktopSelection, supabase]);

  const handleBackToSidebar = useCallback(() => {
    syncCancelledRef.current = true;
    selectedSlugRef.current = undefined;
    setSelectedNote(null);
    if (isMobile) {
      setUrl("/notes");
    }
  }, [isMobile]);

  const handleNoteCreated = useCallback((note: NoteType) => {
    selectedSlugRef.current = note.slug;
    persistDesktopSelection(note.slug);
    setSelectedNote(withDisplayCreatedAt(note));
    setUrl(`/notes/${note.slug}`);
  }, [persistDesktopSelection]);

  const selectedSlugForSidebar = isMobile
    ? (selectedNote?.slug ?? null)
    : (selectedNote?.slug ?? getNotesSelectedSlugMemory() ?? loadNotesSelectedSlug() ?? null);

  return {
    handleBackToSidebar,
    handleNoteCreated,
    handleNoteSelect,
    selectedNote,
    selectedSlugForSidebar,
  };
}
