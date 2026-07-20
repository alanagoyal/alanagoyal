"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Note } from "@/lib/notes/types";
import { Icons } from "./icons";
import {
  getImageFromClipboard,
  getImagesFromDataTransfer,
  uploadNoteImage,
  insertImageMarkdown,
} from "@/lib/notes/image-upload";
import { cn } from "@/lib/utils";

const SPACE_TAB = "  ";
const NBSP_TAB = "\u00a0\u00a0";

function hasFilePayload(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types || []).includes("Files");
}

function hasImagePayload(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;

  const itemTypes = Array.from(dataTransfer.items || []).map((item) => item.type);
  return itemTypes.some((type) => type.startsWith("image/"));
}

function getTaskText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTaskText).join("");
  }

  if (!React.isValidElement(node)) {
    return "";
  }

  if (typeof node.type === "string" && node.type === "a") {
    const href = node.props.href ?? "";
    return `[${getTaskText(node.props.children)}](${href})`;
  }

  return getTaskText(node.props.children);
}

export default function NoteContent({
  note,
  saveNote,
  canEdit,
  isEditing,
  setIsEditing,
}: {
  note: Note;
  saveNote: (updates: Partial<Note>) => void;
  canEdit: boolean;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const clickRelativeYRef = useRef<number | null>(null);
  const dragDepthRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadFeedbackDismissed, setIsUploadFeedbackDismissed] = useState(false);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, [setIsEditing]);

  // Capture click position when clicking on markdown to enter edit mode
  const handleMarkdownClick = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    // Store relative Y position (0-1) within the content area
    clickRelativeYRef.current = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  }, []);

  // Auto-focus textarea when entering edit mode, cursor at end of clicked line
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();

      if (clickRelativeYRef.current !== null) {
        const relativeY = clickRelativeYRef.current;
        clickRelativeYRef.current = null;

        const content = textarea.value;
        const lines = content.split('\n');

        // Estimate which line was clicked based on relative Y position
        const estimatedLine = Math.floor(relativeY * lines.length);
        const targetLine = Math.min(estimatedLine, lines.length - 1);

        // Calculate character position at END of that line
        let charPosition = 0;
        for (let i = 0; i <= targetLine; i++) {
          charPosition += lines[i].length;
          if (i < targetLine) charPosition += 1; // +1 for newline
        }

        textarea.setSelectionRange(charPosition, charPosition);
      } else {
        // No click position (e.g., new note), place at end
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }
    }
  }, [isEditing]);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && isEditing) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [note.content, isEditing]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    saveNote({ content: e.target.value });
  }, [saveNote]);

  const ensureTextareaReady = useCallback(async () => {
    if (textareaRef.current) return textareaRef.current;

    return await new Promise<HTMLTextAreaElement | null>((resolve) => {
      const startedAt = performance.now();

      const poll = () => {
        if (textareaRef.current) {
          resolve(textareaRef.current);
          return;
        }

        if (performance.now() - startedAt > 1500) {
          resolve(null);
          return;
        }

        requestAnimationFrame(poll);
      };

      poll();
    });
  }, []);

  const uploadAndInsertImages = useCallback(
    async (files: File[], options?: { insertAtEnd?: boolean }) => {
      if (!canEdit || files.length === 0) return;

      setUploadError(null);
      setIsUploadFeedbackDismissed(false);
      setIsUploadingImages(true);

      if (options?.insertAtEnd || !isEditing) {
        setIsEditing(true);
      }

      try {
        const textarea = await ensureTextareaReady();
        if (!textarea) {
          setUploadError("Could not open the editor to insert the image.");
          return;
        }

        if (options?.insertAtEnd) {
          const end = textarea.value.length;
          textarea.setSelectionRange(end, end);
          textarea.focus();
        }

        for (const file of files) {
          const result = await uploadNoteImage(file, note.id);

          if (!result.success || !result.url) {
            setUploadError(result.error ?? "Image upload failed.");
            continue;
          }

          const altText =
            file.name.replace(/\.[^.]+$/, "").trim() || "image";
          insertImageMarkdown(textarea, result.url, altText);
        }

        const newContent = textarea.value;
        setTimeout(() => saveNote({ content: newContent }), 0);
      } catch (error) {
        console.error("Unexpected error during image upload:", error);
        setUploadError("An unexpected error occurred during image upload.");
      } finally {
        setIsUploadingImages(false);
      }
    },
    [canEdit, ensureTextareaReady, isEditing, note.id, saveNote, setIsEditing]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!canEdit) return;

      const clipboardEvent = e.nativeEvent as ClipboardEvent;
      const imageFile = getImageFromClipboard(clipboardEvent);

      if (!imageFile) return;

      // Prevent default paste behavior for images
      e.preventDefault();
      await uploadAndInsertImages([imageFile]);
    },
    [canEdit, uploadAndInsertImages]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!canEdit) return;

      if (!hasFilePayload(e.dataTransfer)) return;

      e.preventDefault();
      dragDepthRef.current += 1;
      setUploadError(null);
      setIsDragActive(hasImagePayload(e.dataTransfer));
    },
    [canEdit]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!canEdit) return;

      if (!hasFilePayload(e.dataTransfer)) return;

      e.preventDefault();
      if (hasImagePayload(e.dataTransfer)) {
        e.dataTransfer.dropEffect = "copy";
        if (!isDragActive) {
          setIsDragActive(true);
        }
      } else {
        e.dataTransfer.dropEffect = "none";
      }
    },
    [canEdit, isDragActive]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;

    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  }, [canEdit]);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      if (!canEdit) return;

      if (!hasFilePayload(e.dataTransfer)) return;

      e.preventDefault();
      const imageFiles = getImagesFromDataTransfer(e.dataTransfer);
      dragDepthRef.current = 0;
      setIsDragActive(false);
      if (imageFiles.length === 0) {
        setUploadError("Only image files can be dropped into notes.");
        return;
      }
      await uploadAndInsertImages(imageFiles, { insertAtEnd: !isEditing });
    },
    [canEdit, isEditing, uploadAndInsertImages]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = textarea.value;

      // Find the start of the current line
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      // Find the end of the current line (or selection)
      const lineEnd = content.indexOf('\n', end);
      const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;

      if (e.shiftKey) {
        // Shift+Tab: Outdent (remove up to 2 spaces or 1 tab)
        const line = content.substring(lineStart, actualLineEnd);
        let outdented = line;

        if (line.startsWith(NBSP_TAB)) {
          outdented = line.substring(NBSP_TAB.length);
        } else if (line.startsWith(SPACE_TAB)) {
          outdented = line.substring(SPACE_TAB.length);
        } else if (line.startsWith('\t')) {
          outdented = line.substring(1);
        } else if (line.startsWith(' ')) {
          outdented = line.substring(1);
        }

        const newContent = content.substring(0, lineStart) + outdented + content.substring(actualLineEnd);
        const charsDiff = line.length - outdented.length;

        saveNote({ content: newContent });

        // Restore cursor position
        setTimeout(() => {
          textarea.setSelectionRange(start - charsDiff, end - charsDiff);
        }, 0);
      } else {
        // Tab: Indent using NBSP so repeated tabs don't become markdown indented code blocks
        const indent = NBSP_TAB;
        const newContent = content.substring(0, lineStart) + indent + content.substring(lineStart);

        saveNote({ content: newContent });

        // Restore cursor position
        setTimeout(() => {
          textarea.setSelectionRange(start + indent.length, end + indent.length);
        }, 0);
      }
    }
  }, [saveNote, setIsEditing]);

  const handleMarkdownCheckboxChange = useCallback((taskText: string, isChecked: boolean) => {
    const updatedContent = note.content.replace(
      new RegExp(`\\[[ x]\\] ${taskText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
      `[${isChecked ? 'x' : ' '}] ${taskText}`
    );
    saveNote({ content: updatedContent });
  }, [note.content, saveNote]);

  type ListItemComponentProps = React.ComponentPropsWithoutRef<"li"> & {
    children?: React.ReactNode;
    index?: number;
  };

  const renderListItem = useCallback(({ children, ...props }: ListItemComponentProps) => {
    if (!props.className?.includes('task-list-item')) return <li {...props}>{children}</li>;

    const childNodes = React.Children.toArray(children);
    const checkbox = childNodes.find(
      (child): child is React.ReactElement<{ checked?: boolean }> =>
        React.isValidElement(child) &&
        typeof child.type === "string" &&
        child.type === "input"
    );
    if (!checkbox) return <li {...props}>{children}</li>;

    const isChecked = Boolean(checkbox.props.checked);
    const taskContent = childNodes.filter((child) => child !== checkbox);
    const taskText = taskContent.map(getTaskText).join("").trim();

    const taskId = `task-${taskText.substring(0, 20).replace(/\s+/g, '-').toLowerCase()}-${props.index ?? 0}`;

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
    const href = props.href || "";
    const isExternal = /^https?:\/\//i.test(href);
    return (
      <a
        {...props}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        onClick={stopPropagation}
      >
        {props.children}
      </a>
    );
  }, [stopPropagation]);

  const renderImage = useCallback((props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const src = typeof props.src === "string" ? props.src : "";
    if (!src) return null;

    return (
      <Image
        src={src}
        alt={props.alt || "image"}
        width={1200}
        height={800}
        className="w-full max-w-xl h-auto object-contain"
        unoptimized
      />
    );
  }, []);

  return (
    <div
      className="px-2 relative"
      onClick={isEditing ? stopPropagation : undefined}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragActive && canEdit && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-lg border-2 border-dashed border-[#0A7CFF]/60 bg-[#0A7CFF]/6" />
      )}
      {(isEditing && canEdit) || (!note.content && canEdit) ? (
        <Textarea
          ref={textareaRef}
          id="note-content"
          value={note.content || ""}
          className="min-h-[100px] focus:outline-none leading-normal resize-none overflow-hidden"
          placeholder="Start writing..."
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onClick={stopPropagation}
          onFocus={handleFocus}
        />
      ) : (
        <div className="text-base desktop:text-sm" onClick={handleMarkdownClick}>
          <ReactMarkdown
            className="markdown-body"
            remarkPlugins={[remarkGfm]}
            components={{
              li: renderListItem,
              a: renderLink,
              img: renderImage,
            }}
          >
            {note.content || "Start writing..."}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
