import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Search } from "lucide-react"; 

export default function SearchBar({ notes, onSearchResults }: { notes: any[], onSearchResults: (results: any[] | null) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    onSearchResults(null);
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    if (term.length > 0) {
      const results = notes.filter(note =>
        note.title.toLowerCase().includes(term.toLowerCase()) ||
        note.content.toLowerCase().includes(term.toLowerCase())
      );
      onSearchResults(results);
    } else {
      onSearchResults(null);
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search"
        className="w-full pl-8 pr-2 rounded-md text-sm placeholder:text-muted-foreground"
        aria-label="Search notes"
      />
    </div>
  );
};
