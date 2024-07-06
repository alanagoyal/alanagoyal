"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import SessionId from "./session-id";
import { Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { CommandMenu } from "./command-menu";
import { SidebarContent } from './sidebar-content';
import { groupNotesByCategory, sortGroupedNotes } from '@/lib/note-utils';

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
}: {
  notes: any[];
  onNoteSelect: (note: any) => void;
}) {
  const [sessionId, setSessionId] = useState("");
  const [selectedNoteSlug, setSelectedNoteSlug] = useState<string | null>(null);
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearchResults, setLocalSearchResults] = useState<any[] | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [groupedNotes, setGroupedNotes] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    if (pathname) {
      const slug = pathname.split("/").pop();
      setSelectedNoteSlug(slug || null);
    }
  }, [pathname]);

  useEffect(() => {
    const storedPinnedNotes = localStorage.getItem("pinnedNotes");
    if (storedPinnedNotes) {
      setPinnedNotes(new Set(JSON.parse(storedPinnedNotes)));
    } else {
      const initialPinnedNotes = new Set(
        notes
          .filter(
            (note) =>
              note.slug === "about-me" ||
              note.slug === "quick-links" ||
              note.session_id === sessionId
          )
          .map((note) => note.slug)
      );
      setPinnedNotes(initialPinnedNotes);
      localStorage.setItem(
        "pinnedNotes",
        JSON.stringify(Array.from(initialPinnedNotes))
      );
    }
  }, [notes, sessionId]);

  useEffect(() => {
    const userSpecificNotes = notes.filter(
      (note) => note.public || note.session_id === sessionId
    );
    const grouped = groupNotesByCategory(userSpecificNotes, pinnedNotes);
    sortGroupedNotes(grouped);
    setGroupedNotes(grouped);
  }, [notes, sessionId, pinnedNotes]);

  const togglePinned = useCallback((slug: string) => {
    setPinnedNotes((prev) => {
      const newPinned = new Set(prev);
      if (newPinned.has(slug)) {
        newPinned.delete(slug);
      } else {
        newPinned.add(slug);
      }
      localStorage.setItem(
        "pinnedNotes",
        JSON.stringify(Array.from(newPinned))
      );
      return newPinned;
    });
  }, []);

  const addNewPinnedNote = useCallback((slug: string) => {
    setPinnedNotes((prev) => {
      const newPinned = new Set(prev).add(slug);
      localStorage.setItem(
        "pinnedNotes",
        JSON.stringify(Array.from(newPinned))
      );
      return newPinned;
    });
  }, []);

  const flattenedNotes = useCallback(() => {
    return categoryOrder.flatMap((category) =>
      groupedNotes[category] ? groupedNotes[category] : []
    );
  }, [groupedNotes]);

  const navigateNotes = useCallback(
    (direction: "up" | "down") => {
      if (!localSearchResults) {
        const flattened = flattenedNotes();
        const currentIndex = flattened.findIndex(
          (note) => note.slug === selectedNoteSlug
        );
        let nextIndex;

        if (direction === "up") {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : flattened.length - 1;
        } else {
          nextIndex = currentIndex < flattened.length - 1 ? currentIndex + 1 : 0;
        }

        const nextNote = flattened[nextIndex];
        if (nextNote) {
          router.push(`/${nextNote.slug}`);
        }
      }
    },
    [flattenedNotes, selectedNoteSlug, router, localSearchResults]
  );

  const handlePinToggle = useCallback((slug: string) => {
    togglePinned(slug);
    router.push(`/${slug}`);
  }, [togglePinned, router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      if (isTyping && event.key === "Escape") {
        (target as HTMLElement).blur();
      } else if (!isTyping) {
        if (event.key === "j" && !event.metaKey) {
          event.preventDefault();
          if (localSearchResults) {
            setHighlightedIndex((prevIndex) =>
              (prevIndex + 1) % localSearchResults.length
            );
          } else {
            navigateNotes("down");
          }
        } else if (event.key === "k" && !event.metaKey) {
          event.preventDefault();
          if (localSearchResults) {
            setHighlightedIndex((prevIndex) =>
              (prevIndex - 1 + localSearchResults.length) % localSearchResults.length
            );
          } else {
            navigateNotes("up");
          }
        } else if (event.key === "p" && !event.metaKey) {
          event.preventDefault();
          if (selectedNoteSlug) {
            handlePinToggle(selectedNoteSlug);
          }
        } else if (event.key === "/") {
          event.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigateNotes, selectedNoteSlug, handlePinToggle, localSearchResults, setHighlightedIndex]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <SessionId setSessionId={setSessionId} />
      <CommandMenu
        notes={notes}
        sessionId={sessionId}
        addNewPinnedNote={addNewPinnedNote}
        navigateNotes={navigateNotes}
        togglePinned={togglePinned}
        selectedNoteSlug={selectedNoteSlug}
      />
      <div className="flex-1 overflow-y-auto">
        <SidebarContent
          groupedNotes={groupedNotes}
          setGroupedNotes={setGroupedNotes}
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
        />
      </div>
    </div>
  );
}