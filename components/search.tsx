import { RefObject, Dispatch, SetStateAction } from "react";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
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

export default function SearchBar({
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
    <div className="pt-2 px-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-4000 h-4 w-4" />
        <Input
          id="search"
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search"
          className="w-full pl-8 pr-2 rounded-md text-base sm:text-sm placeholder:text-gray-400"
          aria-label="Search notes"
          autoComplete="off"
          ref={inputRef}
        />
      </div>
    </div>
  );
}
