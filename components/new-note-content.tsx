"use client";

import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import { debounce } from "lodash";

export default function NewNoteContent({
  note,
  saveNote,
}: {
  note: any;
  saveNote: (updates: { content: string }) => void;
}) {
  const [localContent, setLocalContent] = useState(note.content);
  const debouncedSave = debounce((content) => {
    saveNote({ content });
  });

  useEffect(() => {
    setLocalContent(note.content);
    debouncedSave(note.content);
  }, [note.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    debouncedSave(newContent);
  };

  return (
    <div>
      <Textarea
        value={localContent}
        className="bg-[#1e1e1e] min-h-screen focus:outline-none"
        placeholder="Start writing..."
        onChange={handleChange}
      />
    </div>
  );
}
