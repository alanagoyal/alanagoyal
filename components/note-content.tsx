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
  const router = useRouter();

  useEffect(() => {
    setLocalContent(note.content);
  }, [note.content]);

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
    saveNote({ content: e.target.value });
  };

  return (
    <div className="px-2">
      {isEditing ? (
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
          onClick={() => !note.public && setIsEditing(true)}
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
