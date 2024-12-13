import { RefObject, Dispatch, SetStateAction } from "react";
import { Search, X } from "lucide-react";
import { Note } from "@/lib/types";

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
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={14} />
        <input
          id="search"
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search"
          className="w-full pl-8 pr-8 py-0.5 bg-background rounded-lg text-base sm:text-sm placeholder:text-sm focus:outline-none border border-gray-400/20"
          aria-label="Search notes"
          autoComplete="off"
          ref={inputRef}
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="text-muted-foreground" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
