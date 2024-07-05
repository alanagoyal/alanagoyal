import { useState, useEffect, RefObject } from "react";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { searchNotes, Note } from "@/lib/search";

export default function SearchBar({ 
  notes, 
  onSearchResults, 
  sessionId, 
  inputRef 
}: { 
  notes: Note[], 
  onSearchResults: (results: Note[] | null) => void, 
  sessionId: string,
  inputRef: RefObject<HTMLInputElement>
}) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    onSearchResults(null);
  }, [onSearchResults]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    if (term.length > 0) {
      const results = searchNotes(notes, term, sessionId);
      onSearchResults(results);
    } else {
      onSearchResults(null);
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        id="search"
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search"
        className="w-full pl-8 pr-2 rounded-md text-sm placeholder:text-gray-400"
        aria-label="Search notes"
        autoComplete="off"
        ref={inputRef}
      />
    </div>
  );
};
