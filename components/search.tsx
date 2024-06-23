import { useState } from "react";
import { Input } from "./ui/input";

export default function SearchBar({ notes, onSearchResults }: { notes: any[], onSearchResults: (results: any[]) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

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
      onSearchResults([]);
    }
  };

  return (
    <div className="mb-4">
      <Input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search notes..."
        className="w-full p-2 border border-gray-300 rounded-md"
      />
    </div>
  );
};
