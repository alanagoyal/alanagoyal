"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { getBoundedMarkdownPreview } from "@/lib/notes/markdown-preview";

const visibilityCallbacks = new WeakMap<Element, () => void>();
let previewVisibilityObserver: IntersectionObserver | null = null;

function observePreviewVisibility(
  element: Element,
  onVisible: () => void,
): (() => void) | null {
  if (typeof IntersectionObserver === "undefined") return null;

  previewVisibilityObserver ??= new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        visibilityCallbacks.get(entry.target)?.();
        visibilityCallbacks.delete(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "600px 0px" },
  );

  visibilityCallbacks.set(element, onVisible);
  previewVisibilityObserver.observe(element);

  return () => {
    visibilityCallbacks.delete(element);
    previewVisibilityObserver?.unobserve(element);
  };
}

interface NoteMarkdownPreviewProps {
  content: string;
  className?: string;
  compact?: boolean;
  expanded?: boolean;
  deferUntilVisible?: boolean;
  maxCharacters?: number;
}

export const NoteMarkdownPreview = memo(function NoteMarkdownPreview({
  content,
  className,
  compact = false,
  expanded = false,
  deferUntilVisible = false,
  maxCharacters,
}: NoteMarkdownPreviewProps) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const shouldRender = !deferUntilVisible || isNearViewport;
  const previewContent = useMemo(
    () =>
      maxCharacters === undefined
        ? content
        : getBoundedMarkdownPreview(content, maxCharacters),
    [content, maxCharacters],
  );
  const previewClassName = cn(
    "note-markdown-preview",
    compact && "note-markdown-preview-compact",
    expanded && "note-markdown-preview-expanded",
    className,
  );

  useEffect(() => {
    if (!deferUntilVisible || isNearViewport) return;

    const placeholder = placeholderRef.current;
    if (!placeholder) return;

    const stopObserving = observePreviewVisibility(placeholder, () => {
      setIsNearViewport(true);
    });

    if (!stopObserving) {
      setIsNearViewport(true);
      return;
    }

    return stopObserving;
  }, [deferUntilVisible, isNearViewport]);

  if (!shouldRender) {
    return (
      <div
        ref={placeholderRef}
        aria-hidden
        className={previewClassName}
        data-note-preview-pending
      />
    );
  }

  return (
    <ReactMarkdown
      className={previewClassName}
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
      {previewContent || "Start writing..."}
    </ReactMarkdown>
  );
});
