"use client";

import React, { useState, useCallback } from "react";
import { Textarea } from "./ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Note } from "@/lib/types";

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    saveNote({ content: e.target.value });
  }, [saveNote]);

  const handleMarkdownCheckboxChange = useCallback((taskText: string, isChecked: boolean) => {
    const lines = note.content.split('\n');
    const updatedLines = lines.map(line => {
      if (line.includes(`] ${taskText}`)) {
        return line.replace(/\[[ x]\]/, isChecked ? '[x]' : '[ ]');
      }
      return line;
    });
    const updatedContent = updatedLines.join('\n');
    saveNote({ content: updatedContent });
  }, [note.content, saveNote]);

  const renderListItem = useCallback(({ children, ...props }: any) => {
    if (props.className?.includes('task-list-item')) {
      const checkboxIndex = children.findIndex((child: any) => child.type === 'input');
      if (checkboxIndex === -1) return <li {...props}>{children}</li>;

      const isChecked = children[checkboxIndex].props.checked;
      const taskText = children.slice(checkboxIndex + 1).join('').trim();
      
      return (
        <li {...props}>
          <span 
            onClick={(e) => {
              e.stopPropagation();
              if (canEdit) {
                handleMarkdownCheckboxChange(taskText, !isChecked);
              }
            }}
            className={`${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              readOnly
              className="pointer-events-none"
            />
            {' ' + taskText}
          </span>
        </li>
      );
    }
    return <li {...props}>{children}</li>;
  }, [canEdit, handleMarkdownCheckboxChange]);

  return (
    <div className="px-2">
      {(isEditing && canEdit) || (!note.content && canEdit) ? (
        <Textarea
          id="content"
          value={note.content || ""}
          className="bg-[#1c1c1c] min-h-dvh focus:outline-none"
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
            className="markdown-body min-h-dvh"
            remarkPlugins={[remarkGfm]}
            components={{
              li: renderListItem,
            }}
          >
            {note.content || "Start writing..."}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}