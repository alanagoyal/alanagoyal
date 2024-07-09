"use client";

import { useState } from "react";
import { Textarea } from "./ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function NoteContent({
  note,
  saveNote,
  canEdit,
}: {
  note: any;
  saveNote: (updates: Partial<typeof note>) => void;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(!note.content && canEdit);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    saveNote({ content: e.target.value });
  };

  return (
    <div className="px-2">
      {isEditing && canEdit ? (
        <Textarea
          id="content"
          value={note.content}
          className="bg-[#1c1c1c] min-h-screen focus:outline-none"
          placeholder="Start writing..."
          onChange={handleChange}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
        />
      ) : (
        <div
          className="bg-[#1c1c1c] h-full text-sm"
          onClick={() => canEdit && !note.public && setIsEditing(true)}
        >
          <ReactMarkdown
            className="markdown-body min-h-screen"
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {note.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}