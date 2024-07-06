"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SessionId from "./session-id";
import { Pin } from "lucide-react";
import NewNote from "./new-note";
import SearchBar from "./search";
import { useRouter } from "next/navigation";
import { CommandMenu } from "./command-menu";
import { NoteItem } from './note-item';

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

  useEffect(() => {
    const slug = pathname.split("/").pop();
    setSelectedNoteSlug(slug || null);
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

  const userSpecificNotes = notes.filter(
    (note) => note.public || note.session_id === sessionId
  );
  const groupedNotes = groupNotesByCategory(userSpecificNotes, pinnedNotes);
  sortGroupedNotes(groupedNotes);

  function groupNotesByCategory(notes: any[], pinnedNotes: Set<string>) {
    const groupedNotes: any = {
      pinned: [],
    };

    notes.forEach((note) => {
      if (pinnedNotes.has(note.slug)) {
        groupedNotes.pinned.push(note);
        return;
      }

      let category = note.category;
      if (!note.public) {
        const createdDate = new Date(note.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (createdDate.toDateString() === today.toDateString()) {
          category = "today";
        } else if (createdDate.toDateString() === yesterday.toDateString()) {
          category = "yesterday";
        } else if (createdDate > sevenDaysAgo) {
          category = "7";
        } else if (createdDate > thirtyDaysAgo) {
          category = "30";
        } else {
          category = "older";
        }
      }

      if (!groupedNotes[category]) {
        groupedNotes[category] = [];
      }
      groupedNotes[category].push(note);
    });

    return groupedNotes;
  }

  function sortGroupedNotes(groupedNotes: any) {
    Object.keys(groupedNotes).forEach((category) => {
      groupedNotes[category].sort((a: any, b: any) =>
        b.created_at.localeCompare(a.created_at)
      );
    });
  }

  const router = useRouter();

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
            togglePinned(selectedNoteSlug);
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
  }, [navigateNotes, selectedNoteSlug, togglePinned, localSearchResults, setHighlightedIndex]);

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
          selectedNoteSlug={selectedNoteSlug}
          onNoteSelect={onNoteSelect}
          notes={notes}
          sessionId={sessionId}
          togglePinned={togglePinned}
          pinnedNotes={pinnedNotes}
          addNewPinnedNote={addNewPinnedNote}
          searchInputRef={searchInputRef}
          localSearchResults={localSearchResults}
          setLocalSearchResults={setLocalSearchResults}
          highlightedIndex={highlightedIndex}
          setHighlightedIndex={setHighlightedIndex}
        />
      </div>
    </div>
  );
}

function SidebarContent({
  groupedNotes,
  selectedNoteSlug,
  onNoteSelect,
  notes,
  sessionId,
  togglePinned,
  pinnedNotes,
  addNewPinnedNote,
  searchInputRef,
  localSearchResults,
  setLocalSearchResults,
  highlightedIndex,
  setHighlightedIndex,
}: {
  groupedNotes: any;
  selectedNoteSlug: string | null;
  onNoteSelect: (note: any) => void;
  notes: any[];
  sessionId: string;
  togglePinned: (slug: string) => void;
  pinnedNotes: Set<string>;
  addNewPinnedNote: (slug: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  localSearchResults: any[] | null;
  setLocalSearchResults: React.Dispatch<React.SetStateAction<any[] | null>>;
  highlightedIndex: number;
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
  const router = useRouter();

  const clearSearch = useCallback(() => {
    setLocalSearchResults(null);
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  }, [searchInputRef, setLocalSearchResults]);

  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    if (localSearchResults && localSearchResults.length > 0) {
      if (event.key === 'Enter') {
        event.preventDefault();
        const selectedNote = localSearchResults[highlightedIndex];
        router.push(`/${selectedNote.slug}`);
        clearSearch();
      } else if (!isSearchInputFocused) {
        if (event.key === 'j' || event.key === 'ArrowDown') {
          event.preventDefault();
          setHighlightedIndex((prevIndex) =>
            (prevIndex + 1) % localSearchResults.length
          );
        } else if (event.key === 'k' || event.key === 'ArrowUp') {
          event.preventDefault();
          setHighlightedIndex((prevIndex) =>
            (prevIndex - 1 + localSearchResults.length) % localSearchResults.length
          );
        }
      }
    }
  }, [localSearchResults, highlightedIndex, router, isSearchInputFocused, clearSearch, setHighlightedIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (searchInputRef.current && document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur();
          setIsSearchInputFocused(false);
        }
      } else {
        handleKeyNavigation(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyNavigation, searchInputRef, setIsSearchInputFocused]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [localSearchResults, setHighlightedIndex]);

  return (
    <div className="pt-4 px-2">
      <SearchBar
        notes={notes}
        onSearchResults={setLocalSearchResults}
        sessionId={sessionId}
        inputRef={searchInputRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onFocus={() => setIsSearchInputFocused(true)}
        onBlur={() => setIsSearchInputFocused(false)}
      />
      <div className="flex py-2 mx-2 items-center justify-between">
        <h2 className="text-lg font-bold">Notes</h2>
        <NewNote addNewPinnedNote={addNewPinnedNote} />
      </div>
      {localSearchResults === null ? (
        <nav>
          {categoryOrder.map((categoryKey) =>
            groupedNotes[categoryKey] &&
            groupedNotes[categoryKey].length > 0 ? (
              <section key={categoryKey}>
                <h3 className="py-1 text-xs font-bold text-gray-400 ml-2">
                  {labels[categoryKey as keyof typeof labels]}
                </h3>
                <ul className="space-y-2">
                  {groupedNotes[categoryKey].map((item: any, index: number) => (
                    <NoteItem
                      key={index}
                      item={item}
                      selectedNoteSlug={selectedNoteSlug}
                      sessionId={sessionId}
                      onNoteSelect={onNoteSelect}
                      groupedNotes={groupedNotes}
                      categoryOrder={categoryOrder}
                      togglePinned={togglePinned}
                      isPinned={pinnedNotes.has(item.slug)}
                      isHighlighted={false}
                      isSearching={false}
                    />
                  ))}
                </ul>
              </section>
            ) : null
          )}
        </nav>
      ) : localSearchResults.length > 0 ? (
        <ul className="space-y-2">
          {localSearchResults.map((item, index) => (
            <NoteItem
              key={item.id}
              item={item}
              selectedNoteSlug={selectedNoteSlug}
              sessionId={sessionId}
              onNoteSelect={onNoteSelect}
              groupedNotes={groupedNotes}
              categoryOrder={categoryOrder}
              togglePinned={togglePinned}
              isPinned={pinnedNotes.has(item.slug)}
              isHighlighted={index === highlightedIndex}
              isSearching={true}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 px-2 mt-4">No results found</p>
      )}
    </div>
  );
}