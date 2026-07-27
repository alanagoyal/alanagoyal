"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface NoteMarkdownPreviewProps {
  content: string;
  className?: string;
  expanded?: boolean;
}

export function NoteMarkdownPreview({
  content,
  className,
  expanded = false,
}: NoteMarkdownPreviewProps) {
  return (
    <ReactMarkdown
      className={cn(
        "note-markdown-preview",
        expanded && "note-markdown-preview-expanded",
        className,
      )}
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children }) => (
          <span className="note-markdown-preview-link">{children}</span>
        ),
        input: ({ checked, type }) =>
          type === "checkbox" ? (
            <span
              aria-hidden
              className={cn(
                "note-markdown-preview-checkbox",
                checked && "note-markdown-preview-checkbox-checked",
              )}
            >
              {checked ? "✓" : null}
            </span>
          ) : null,
        img: ({ alt, src }) =>
          typeof src === "string" && src ? (
            <Image
              src={src}
              alt={alt || "Note image"}
              width={1200}
              height={800}
              className="note-markdown-preview-image"
              unoptimized
            />
          ) : null,
      }}
    >
      {content || "Start writing..."}
    </ReactMarkdown>
  );
}
