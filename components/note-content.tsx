"use client";

import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import ReactMarkdown from "react-markdown";
import { debounce } from 'lodash'; 
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function NoteContent({
  note,
  saveNote,
}: {
  note: any;
  saveNote: (updates: { content: string }) => void;
}) {
  const [localContent, setLocalContent] = useState(note.content);
  const [isEditing, setIsEditing] = useState(note.content ? false : true);
  const [isPublic, setIsPublic] = useState(note.public);

  useEffect(() => {
    setLocalContent(note.content);
    setIsPublic(note.public);
  }, [note.content, note.public]);

  useEffect(() => {
    const debouncedSave = debounce((content: string) => {
      if (content !== note.content) {
        saveNote({ content });
      }
    }, 1000);

    debouncedSave(localContent);

    return () => debouncedSave.cancel();
  }, [localContent, saveNote, note.content]);

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
          className="bg-[#1c1c1c] min-h-screen focus:outline-none"
          placeholder="Start writing..."
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ) : (
        <div
          className="bg-[#1c1c1c] h-full text-sm"
          onClick={() => !isPublic && setIsEditing(true)}
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
            {localContent}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
