"use client";

import { useState, useCallback, useRef } from "react";
import { Textarea } from "./ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Note } from "@/lib/types";
import {
  MarkdownTable,
  MarkdownTableHead,
  MarkdownTableBody,
  MarkdownTableRow,
  MarkdownTableCell,
} from "./markdown-table";
import { TableToolbar } from "./table-toolbar";

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

  const handleInsertTable = useCallback((rows: number, cols: number) => {
    // Create a markdown table
    const headerRow = "| " + Array(cols).fill("Header").map((h, i) => `${h} ${i + 1}`).join(" | ") + " |";
    const separatorRow = "| " + Array(cols).fill("---").join(" | ") + " |";
    const dataRows = Array(rows - 1).fill(0).map((_, rowIndex) =>
      "| " + Array(cols).fill("Cell").map((c, colIndex) => `${c}`).join(" | ") + " |"
    ).join("\n");

    const table = `\n${headerRow}\n${separatorRow}\n${dataRows}\n\n`;

    // Get current cursor position
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBefore = note.content.substring(0, cursorPos);
      const textAfter = note.content.substring(cursorPos);

      const newContent = textBefore + table + textAfter;
      saveNote({ content: newContent });

      // Set cursor position after the table
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = cursorPos + table.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // If no textarea ref, just append to end
      saveNote({ content: note.content + table });
    }
  }, [note.content, saveNote]);

  return (
    <div className="px-2">
      {(isEditing && canEdit) || (!note.content && canEdit) ? (
        <>
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 mb-2 border-b">
            <TableToolbar onInsertTable={handleInsertTable} />
          </div>
          <Textarea
            ref={textareaRef}
            id="note-content"
            value={note.content || ""}
            className="min-h-dvh focus:outline-none leading-normal"
            placeholder="Start writing..."
            onChange={handleChange}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
          />
        </>
      ) : (
        <div
          className="h-full text-sm"
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
              table: MarkdownTable,
              thead: MarkdownTableHead,
              tbody: MarkdownTableBody,
              tr: MarkdownTableRow,
              th: MarkdownTableCell,
              td: MarkdownTableCell,
            }}
          >
            {note.content || "Start writing..."}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}