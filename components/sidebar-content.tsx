import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import NewNote from "./new-note";
import SearchBar from "./search";
import { NoteItem } from "./note-item";
import { createClient } from "@/utils/supabase/client";
import { Note } from "@/lib/types";

interface SidebarContentProps {
  groupedNotes: Record<string, Note[]>;
  selectedNoteSlug: string | null;
  onNoteSelect: (note: Note) => void;
  notes: Note[];
  sessionId: string;
  handlePinToggle: (slug: string) => void;
  pinnedNotes: Set<string>;
  addNewPinnedNote: (slug: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  localSearchResults: Note[] | null;
  setLocalSearchResults: React.Dispatch<React.SetStateAction<Note[] | null>>;
  highlightedIndex: number;
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
  categoryOrder: string[];
  labels: Record<string, React.ReactNode>;
  setGroupedNotes: React.Dispatch<React.SetStateAction<Record<string, Note[]>>>;
}

export function SidebarContent({
  groupedNotes,
  selectedNoteSlug,
  onNoteSelect,
  notes,
  sessionId,
  handlePinToggle,
  pinnedNotes,
  addNewPinnedNote,
  searchInputRef,
  localSearchResults,
  setLocalSearchResults,
  highlightedIndex,
  setHighlightedIndex,
  categoryOrder,
  labels,
  setGroupedNotes,
}: SidebarContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const clearSearch = useCallback(() => {
    setLocalSearchResults(null);
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  }, [searchInputRef, setLocalSearchResults]);

  const handleKeyNavigation = useCallback(
    (event: KeyboardEvent) => {
      if (localSearchResults && localSearchResults.length > 0) {
        if (event.key === "Enter") {
          event.preventDefault();
          const selectedNote = localSearchResults[highlightedIndex];
          router.push(`/${selectedNote.slug}`);
          clearSearch();
          searchInputRef.current?.blur();
        } else if (!isSearchInputFocused) {
          if (event.key === "j" || event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex(
              (prevIndex) => (prevIndex + 1) % localSearchResults.length
            );
          } else if (event.key === "k" || event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex(
              (prevIndex) =>
                (prevIndex - 1 + localSearchResults.length) %
                localSearchResults.length
            );
          }
        }
      }
    },
    [
      localSearchResults,
      highlightedIndex,
      router,
      isSearchInputFocused,
      clearSearch,
      setHighlightedIndex,
      searchInputRef,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (
          searchInputRef.current &&
          document.activeElement === searchInputRef.current
        ) {
          searchInputRef.current.blur();
          setIsSearchInputFocused(false);
        }
      } else {
        handleKeyNavigation(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyNavigation, searchInputRef, setIsSearchInputFocused]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [localSearchResults, setHighlightedIndex]);

  const onNoteDelete = useCallback(
    (slugToDelete: string) => {
      setGroupedNotes((prevGroupedNotes: Record<string, Note[]>) => {
        const newGroupedNotes = { ...prevGroupedNotes };
        for (const category in newGroupedNotes) {
          newGroupedNotes[category] = newGroupedNotes[category].filter(
            (note: Note) => note.slug !== slugToDelete
          );
        }
        return newGroupedNotes;
      });

      if (localSearchResults) {
        setLocalSearchResults((prevResults) =>
          prevResults
            ? prevResults.filter((note) => note.slug !== slugToDelete)
            : null
        );
      }
    },
    [setGroupedNotes, localSearchResults, setLocalSearchResults]
  );

  const handleEdit = useCallback(
    (slug: string) => {
      clearSearch();
      router.push(`/${slug}`);
    },
    [clearSearch, router]
  );

  const handleDelete = useCallback(
    async (slugToDelete: string) => {
      try {
        clearSearch();
        await onNoteDelete(slugToDelete);

        const allNotes = Object.values(groupedNotes).flat();
        const deletedNoteIndex = allNotes.findIndex(
          (note) => note.slug === slugToDelete
        );
        const noteAbove =
          allNotes[deletedNoteIndex - 1] || allNotes[deletedNoteIndex + 1];

        if (noteAbove) {
          router.push(`/${noteAbove.slug}`);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    },
    [clearSearch, onNoteDelete, groupedNotes, router]
  );

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
                  {groupedNotes[categoryKey].map(
                    (item: Note, index: number) => (
                      <NoteItem
                        key={index}
                        item={item}
                        selectedNoteSlug={selectedNoteSlug}
                        sessionId={sessionId}
                        onNoteSelect={onNoteSelect}
                        groupedNotes={groupedNotes}
                        categoryOrder={categoryOrder}
                        handlePinToggle={handlePinToggle}
                        isPinned={pinnedNotes.has(item.slug)}
                        isHighlighted={false}
                        isSearching={false}
                        onNoteDelete={onNoteDelete}
                        onNoteEdit={handleEdit}
                        router={router}
                      />
                    )
                  )}
                </ul>
              </section>
            ) : null
          )}
        </nav>
      ) : localSearchResults.length > 0 ? (
        <ul className="space-y-2">
          {localSearchResults.map((item: Note, index: number) => (
            <NoteItem
              key={item.id}
              item={item}
              selectedNoteSlug={selectedNoteSlug}
              sessionId={sessionId}
              onNoteSelect={onNoteSelect}
              groupedNotes={groupedNotes}
              categoryOrder={categoryOrder}
              handlePinToggle={handlePinToggle}
              isPinned={pinnedNotes.has(item.slug)}
              isHighlighted={index === highlightedIndex}
              isSearching={true}
              onNoteDelete={handleDelete}
              onNoteEdit={handleEdit}
              router={router}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 px-2 mt-4">No results found</p>
      )}
    </div>
  );
}