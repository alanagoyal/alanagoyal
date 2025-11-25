"use client";

import { useState, useCallback, useRef } from "react";
import { Textarea } from "./ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Note } from "@/lib/types";
import {
  getImageFromClipboard,
  uploadNoteImage,
  insertImageMarkdown,
} from "@/lib/image-upload";
import { toast } from "@/components/ui/use-toast";

export default function NoteContent({
  note,
  saveNote,
  canEdit,
}: {
  note: Note;
  saveNote: (updates: Partial<Note>) => void;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(!note.content && canEdit);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    saveNote({ content: e.target.value });
  }, [saveNote]);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!canEdit) return;

      const clipboardEvent = e.nativeEvent as ClipboardEvent;
      const imageFile = getImageFromClipboard(clipboardEvent);

      if (!imageFile) return;

      // Prevent default paste behavior for images
      e.preventDefault();

      const { dismiss } = toast({ description: "Uploading image..." });

      try {
        const result = await uploadNoteImage(imageFile, note.id);

        dismiss();

        if (result.success && result.url && textareaRef.current) {
          insertImageMarkdown(textareaRef.current, result.url);
          // Save the updated content since the synthetic event doesn't trigger React's onChange
          // Use setTimeout to defer the state update and avoid "Cannot update a component while rendering" warning
          const newContent = textareaRef.current.value;
          setTimeout(() => saveNote({ content: newContent }), 0);
        } else if (result.error) {
          console.error("Image upload failed:", result.error);
          toast({ description: `Failed to upload image: ${result.error}`, variant: "destructive" });
        }
      } catch (error) {
        console.error("Unexpected error during image upload:", error);
        dismiss();
        toast({ description: "An unexpected error occurred while uploading the image.", variant: "destructive" });
      }
    },
    [canEdit, note.id, saveNote]
  );

  const handleMarkdownCheckboxChange = useCallback((taskText: string, isChecked: boolean) => {
    const updatedContent = note.content.replace(
      new RegExp(`\\[[ x]\\] ${taskText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
      `[${isChecked ? 'x' : ' '}] ${taskText}`
    );
    saveNote({ content: updatedContent });
  }, [note.content, saveNote]);

  const renderListItem = useCallback(({ children, ...props }: any) => {
    if (!props.className?.includes('task-list-item')) return <li {...props}>{children}</li>;

    const checkbox = children.find((child: any) => child.type === 'input');
    if (!checkbox) return <li {...props}>{children}</li>;

    const isChecked = checkbox.props.checked;
    const taskContent = children.filter((child: any) => child !== checkbox);
    const taskText = taskContent.map((child: any) => {
      if (typeof child === 'string') return child;
      if (child.type === 'a') return `[${child.props.children}](${child.props.href})`;
      return child.props.children;
    }).join('').trim();

    const taskId = `task-${taskText.substring(0, 20).replace(/\s+/g, '-').toLowerCase()}-${props.index}`;

    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (canEdit) handleMarkdownCheckboxChange(taskText, !isChecked);
    };

    return (
      <li {...props}>
        <span className="flex items-start">
          <span
            onClick={handleCheckboxClick}
            className={`${canEdit ? 'cursor-pointer' : 'cursor-default'} mr-1`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              className="pointer-events-none"
              id={taskId}
              readOnly
            />
          </span>
          <span>{taskContent}</span>
        </span>
      </li>
    );
  }, [canEdit, handleMarkdownCheckboxChange]);

  const renderLink = useCallback((props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    return (
      <a {...props} target="_blank" rel="noopener noreferrer">
        {props.children}
      </a>
    );
  }, []);

  return (
    <div className="px-2">
      {(isEditing && canEdit) || (!note.content && canEdit) ? (
        <Textarea
          ref={textareaRef}
          id="note-content"
          value={note.content || ""}
          className="min-h-dvh focus:outline-none leading-normal"
          placeholder="Start writing..."
          onChange={handleChange}
          onPaste={handlePaste}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
        />
      ) : (
        <div
          className="h-full text-base md:text-sm"
          onClick={(e) => {
            if (canEdit && !note.public) {
              setIsEditing(true);
            }
          }}
        >
          <ReactMarkdown
            className="markdown-body min-h-dvh"
            remarkPlugins={[remarkGfm]}
            components={{
              li: renderListItem,
              a: renderLink,
            }}
          >
            {note.content || "Start writing..."}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}