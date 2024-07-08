"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import SessionId from "./session-id";
import { Pin } from "lucide-react";
import { CommandMenu } from "./command-menu";
import { SidebarContent } from './sidebar-content';
import { groupNotesByCategory, sortGroupedNotes } from '@/lib/note-utils';
import { createClient } from "@/utils/supabase/client";
import { Note } from "@/lib/types";
import { toast } from "./ui/use-toast";
import { KeyboardShortcuts } from './shortcuts';

const labels = {
  pinned: (
    <>
      <Pin className="inline-block w-4 h-4 mr-1" /> Pinned
    </>
  ),
  today: "Today",
  yesterday: "Yesterday",
  "7": "Previous 7 Days",
  "30": "Previous 30 Days",
  older: "Older",
};

const categoryOrder = ["pinned", "today", "yesterday", "7", "30", "older"];

export default function Sidebar({
  notes,
  onNoteSelect,
  isMobile,
}: {
  notes: Note[];
  onNoteSelect: (note: Note) => void;
  isMobile: boolean;
}) {
  const [sessionId, setSessionId] = useState("");
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearchResults, setLocalSearchResults] = useState<Note[] | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  const [openSwipeItemSlug, setOpenSwipeItemSlug] = useState<string | null>(null);
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);

  const selectedNoteSlug = useMemo(() => pathname?.split("/").pop() || null, [pathname]);
  const selectedNote = useMemo(() => notes.find(note => note.slug === selectedNoteSlug) || null, [notes, selectedNoteSlug]);

  const groupedNotes = useMemo(() => {
    const userSpecificNotes = notes.filter(note => note.public || note.session_id === sessionId);
    const grouped = groupNotesByCategory(userSpecificNotes, pinnedNotes);
    sortGroupedNotes(grouped);
    return grouped;
  }, [notes, sessionId, pinnedNotes]);

  const flattenedNotes = useMemo(() => 
    categoryOrder.flatMap(category => groupedNotes[category] || []),
  [groupedNotes]);

  useEffect(() => {
    const storedPinnedNotes = localStorage.getItem("pinnedNotes");
    if (storedPinnedNotes) {
      setPinnedNotes(new Set(JSON.parse(storedPinnedNotes)));
    } else {
      const initialPinnedNotes = new Set(
        notes
          .filter(note => ["about-me", "quick-links"].includes(note.slug) || note.session_id === sessionId)
          .map(note => note.slug)
      );
      setPinnedNotes(initialPinnedNotes);
      localStorage.setItem("pinnedNotes", JSON.stringify(Array.from(initialPinnedNotes)));
    }
  }, [notes, sessionId]);

  const togglePinned = useCallback((slug: string) => {
    setPinnedNotes(prev => {
      const newPinned = new Set(prev);
      newPinned.has(slug) ? newPinned.delete(slug) : newPinned.add(slug);
      localStorage.setItem("pinnedNotes", JSON.stringify(Array.from(newPinned)));
      return newPinned;
    });
  }, []);

  const addNewPinnedNote = useCallback((slug: string) => {
    setPinnedNotes(prev => {
      const newPinned = new Set(prev).add(slug);
      localStorage.setItem("pinnedNotes", JSON.stringify(Array.from(newPinned)));
      return newPinned;
    });
  }, []);

  const navigateNotes = useCallback((direction: "up" | "down") => {
    if (!localSearchResults) {
      const currentIndex = flattenedNotes.findIndex(note => note.slug === selectedNoteSlug);
      const nextIndex = direction === "up"
        ? (currentIndex > 0 ? currentIndex - 1 : flattenedNotes.length - 1)
        : (currentIndex < flattenedNotes.length - 1 ? currentIndex + 1 : 0);
      const nextNote = flattenedNotes[nextIndex];
      if (nextNote) router.push(`/${nextNote.slug}`);
    }
  }, [flattenedNotes, selectedNoteSlug, router, localSearchResults]);

  const handlePinToggle = useCallback((slug: string) => {
    togglePinned(slug);
    if (!isMobile) router.push(`/${slug}`);
  }, [togglePinned, router, isMobile]);

  const handleNoteDelete = useCallback(async (noteToDelete: Note) => {
    if (noteToDelete.public) {
      toast({ description: "Oops! You can't delete that note" });
      return;
    }

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("slug", noteToDelete.slug)
        .eq("session_id", sessionId);

      if (error) throw error;

      const allNotes = flattenedNotes;
      const deletedNoteIndex = allNotes.findIndex(note => note.slug === noteToDelete.slug);
      const nextNote = deletedNoteIndex === 0 ? allNotes[1] : allNotes[deletedNoteIndex - 1];
      
      if (!isMobile) {
        router.push(nextNote ? `/${nextNote.slug}` : "/about-me");
      }
      router.refresh();

    } catch (error) {
      console.error("Error deleting note:", error);
    }
  }, [supabase, sessionId, flattenedNotes, router, isMobile]);

  const clearSearch = useCallback(() => {
    setLocalSearchResults(null);
    setHighlightedIndex(0);
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  }, [setLocalSearchResults, setHighlightedIndex, searchInputRef]);

  return (
    <KeyboardShortcuts
      notes={notes}
      selectedNoteSlug={selectedNoteSlug}
      localSearchResults={localSearchResults}
      highlightedIndex={highlightedIndex}
      handlePinToggle={handlePinToggle}
      handleNoteDelete={handleNoteDelete}
      navigateNotes={navigateNotes}
      clearSearch={clearSearch}
      searchInputRef={searchInputRef}
      isSearchInputFocused={isSearchInputFocused}
      setIsSearchInputFocused={setIsSearchInputFocused}
    >
      <div className="h-full flex flex-col overflow-hidden">
        <SessionId setSessionId={setSessionId} />
        <CommandMenu
          notes={notes}
          sessionId={sessionId}
          addNewPinnedNote={addNewPinnedNote}
          navigateNotes={navigateNotes}
          togglePinned={togglePinned}
          selectedNoteSlug={selectedNoteSlug}
          selectedNote={selectedNote}
          deleteNote={handleNoteDelete}
        />
        <div className="flex-1 overflow-y-auto">
          <SidebarContent
            groupedNotes={groupedNotes}
            selectedNoteSlug={selectedNoteSlug}
            onNoteSelect={onNoteSelect}
            notes={notes}
            sessionId={sessionId}
            handlePinToggle={handlePinToggle}
            pinnedNotes={pinnedNotes}
            addNewPinnedNote={addNewPinnedNote}
            searchInputRef={searchInputRef}
            localSearchResults={localSearchResults}
            setLocalSearchResults={setLocalSearchResults}
            highlightedIndex={highlightedIndex}
            setHighlightedIndex={setHighlightedIndex}
            categoryOrder={categoryOrder}
            labels={labels}
            handleNoteDelete={handleNoteDelete}
            openSwipeItemSlug={openSwipeItemSlug}
            setOpenSwipeItemSlug={setOpenSwipeItemSlug}
          />
        </div>
      </div>
    </KeyboardShortcuts>
  );
}