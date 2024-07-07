import { RefObject } from "react";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { Note } from "@/lib/types";

export default function SearchBar({ 
  notes, 
  onSearchResults, 
  sessionId, 
  inputRef,
  searchQuery,
  setSearchQuery,
  onFocus,
  onBlur,
  setHighlightedIndex,
}: { 
  notes: Note[], 
  onSearchResults: (results: Note[] | null) => void, 
  sessionId: string,
  inputRef: RefObject<HTMLInputElement>,
  searchQuery: string,
  setSearchQuery: (query: string) => void,
  onFocus: () => void,
  onBlur: () => void,
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>,
}) {
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      onSearchResults(null);
      setHighlightedIndex(0);
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
    <div className="relative">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        id="search"
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Search"
        className="w-full pl-8 pr-2 rounded-md text-base sm:text-sm placeholder:text-gray-400"
        aria-label="Search notes"
        autoComplete="off"
        ref={inputRef}
      />
    </div>
  );
}