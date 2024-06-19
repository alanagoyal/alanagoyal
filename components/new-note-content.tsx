"use client";

import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";

export default function NewNoteContent({
  note,
  saveNote,
}: {
  note: any;
  saveNote: (updates: { content: string }) => void;
}) {
  const [localContent, setLocalContent] = useState(note.content);

  useEffect(() => {
    setLocalContent(note.content);
  }, [note.content]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      saveNote({ content: localContent });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [localContent, saveNote]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
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