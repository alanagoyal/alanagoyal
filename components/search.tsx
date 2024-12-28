import { RefObject, Dispatch, SetStateAction, useEffect } from "react";
import { Note } from "@/lib/types";
import { Icons } from "./icons";

interface SearchBarProps {
  notes: Note[];
  onSearchResults: (results: Note[] | null) => void;
  sessionId: string;
  inputRef: RefObject<HTMLInputElement>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setHighlightedIndex: Dispatch<SetStateAction<number>>;
  clearSearch: () => void;
}

export function SearchBar({
  notes,
  onSearchResults,
  sessionId,
  inputRef,
  searchQuery,
  setSearchQuery,
  setHighlightedIndex,
  clearSearch,
}: SearchBarProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle second Escape press to clear search
      if (e.key === "Escape" && document.activeElement !== inputRef.current && searchQuery) {
        clearSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [inputRef, searchQuery, clearSearch]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      clearSearch();
      return;
    }

    const filteredNotes = notes.filter(
      (note) =>
        (note.public || note.session_id === sessionId) &&
        (note.title.toLowerCase().includes(query.toLowerCase()) ||
          note.content.toLowerCase().includes(query.toLowerCase()))
    );

    onSearchResults(filteredNotes);
    setHighlightedIndex(0);
  };

  return (
    <div className="py-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Icons.search className="text-muted-foreground" />
        </div>
        <input
          id="search"
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search"
          className="w-full pl-8 pr-8 py-0.5 rounded-lg text-base sm:text-sm placeholder:text-sm focus:outline-none border border-muted-foreground/20 dark:border-none dark:bg-[#353533]"
          aria-label="Search notes"
          autoComplete="off"
          ref={inputRef}
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={clearSearch}
          >
            <Icons.close className="text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
