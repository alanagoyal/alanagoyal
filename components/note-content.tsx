"use client";

import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import ReactMarkdown from "react-markdown";
import { debounce } from 'lodash'; 
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useRouter } from "next/navigation";

export default function NoteContent({
  note,
  saveNote,
}: {
  note: any;
  saveNote: (updates: { content: string }) => Promise<void>;
}) {
  const [localContent, setLocalContent] = useState(note.content);
  const [isEditing, setIsEditing] = useState(note.content ? false : true);
  const [isPublic, setIsPublic] = useState(note.public);
  const router = useRouter();

  useEffect(() => {
    setLocalContent(note.content);
    setIsPublic(note.public);
  }, [note.content, note.public]);

  useEffect(() => {
    const debouncedSave = debounce(async (content: string) => {
      if (content !== note.content) {
        await saveNote({ content });
        
        // Revalidate after saving
        await fetch('/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug: note.slug }),
        });

        router.refresh();
      }
    }, 1000);

    debouncedSave(localContent);

    return () => debouncedSave.cancel();
  }, [localContent, saveNote, note.content, note.slug, router]);

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
    <div className="px-2">
      {isEditing ? (
        <Textarea
          id="content"
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
