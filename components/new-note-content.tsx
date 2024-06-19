"use client";

import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import ReactMarkdown from "react-markdown";

export default function NewNoteContent({
  note,
  saveNote,
}: {
  note: any;
  saveNote: (updates: { content: string }) => void;
}) {
  const [localContent, setLocalContent] = useState(note.content);
  const [isEditing, setIsEditing] = useState(note.content ? false : true);

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

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <div>
      {isEditing ? (
        <Textarea
          value={localContent}
          className="bg-[#1e1e1e] min-h-screen focus:outline-none"
          placeholder="Start writing..."
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ) : (
        <div
          className="bg-[#1e1e1e] h-full text-sm"
          onClick={() => setIsEditing(true)}
        >
          <ReactMarkdown className="markdown-body min-h-screen">
            {localContent}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
