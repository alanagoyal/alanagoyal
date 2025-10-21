"use client";

import React, { useRef, RefObject } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Code,
  Quote,
  Minus,
  Link,
  Strikethrough,
} from "lucide-react";
import { useMobileDetect } from "./mobile-detector";

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  onContentChange: (content: string) => void;
}

type MarkdownAction =
  | "bold"
  | "italic"
  | "strikethrough"
  | "h1"
  | "h2"
  | "bullet"
  | "number"
  | "checkbox"
  | "code"
  | "quote"
  | "divider"
  | "link";

export function MarkdownToolbar({
  textareaRef,
  onContentChange,
}: MarkdownToolbarProps) {
  const isMobile = useMobileDetect();

  const insertMarkdown = (action: MarkdownAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let newText = "";
    let cursorOffset = 0;

    // Get the start of the current line
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = text.indexOf("\n", end);
    const currentLine = text.substring(
      lineStart,
      lineEnd === -1 ? text.length : lineEnd
    );

    switch (action) {
      case "bold":
        if (selectedText) {
          newText =
            text.substring(0, start) +
            `**${selectedText}**` +
            text.substring(end);
          cursorOffset = start + selectedText.length + 4;
        } else {
          newText =
            text.substring(0, start) + "**bold text**" + text.substring(end);
          cursorOffset = start + 2;
        }
        break;

      case "italic":
        if (selectedText) {
          newText =
            text.substring(0, start) + `*${selectedText}*` + text.substring(end);
          cursorOffset = start + selectedText.length + 2;
        } else {
          newText =
            text.substring(0, start) + "*italic text*" + text.substring(end);
          cursorOffset = start + 1;
        }
        break;

      case "strikethrough":
        if (selectedText) {
          newText =
            text.substring(0, start) +
            `~~${selectedText}~~` +
            text.substring(end);
          cursorOffset = start + selectedText.length + 4;
        } else {
          newText =
            text.substring(0, start) +
            "~~strikethrough text~~" +
            text.substring(end);
          cursorOffset = start + 2;
        }
        break;

      case "h1":
        if (currentLine.startsWith("# ")) {
          // Remove heading
          newText =
            text.substring(0, lineStart) +
            currentLine.substring(2) +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start - 2;
        } else {
          // Add heading
          newText =
            text.substring(0, lineStart) +
            "# " +
            currentLine +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start + 2;
        }
        break;

      case "h2":
        if (currentLine.startsWith("## ")) {
          // Remove heading
          newText =
            text.substring(0, lineStart) +
            currentLine.substring(3) +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start - 3;
        } else {
          // Add heading
          newText =
            text.substring(0, lineStart) +
            "## " +
            currentLine +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start + 3;
        }
        break;

      case "bullet":
        if (currentLine.startsWith("- ")) {
          // Remove bullet
          newText =
            text.substring(0, lineStart) +
            currentLine.substring(2) +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start - 2;
        } else {
          // Add bullet
          newText =
            text.substring(0, lineStart) +
            "- " +
            currentLine +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start + 2;
        }
        break;

      case "number":
        if (/^\d+\.\s/.test(currentLine)) {
          // Remove numbering
          const match = currentLine.match(/^\d+\.\s/);
          if (match) {
            newText =
              text.substring(0, lineStart) +
              currentLine.substring(match[0].length) +
              text.substring(lineEnd === -1 ? text.length : lineEnd);
            cursorOffset = start - match[0].length;
          }
        } else {
          // Add numbering
          newText =
            text.substring(0, lineStart) +
            "1. " +
            currentLine +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start + 3;
        }
        break;

      case "checkbox":
        if (currentLine.startsWith("- [ ] ") || currentLine.startsWith("- [x] ")) {
          // Remove checkbox
          newText =
            text.substring(0, lineStart) +
            currentLine.substring(6) +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start - 6;
        } else {
          // Add checkbox
          newText =
            text.substring(0, lineStart) +
            "- [ ] " +
            currentLine +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start + 6;
        }
        break;

      case "code":
        if (selectedText) {
          newText =
            text.substring(0, start) +
            `\`${selectedText}\`` +
            text.substring(end);
          cursorOffset = start + selectedText.length + 2;
        } else {
          newText =
            text.substring(0, start) + "`code`" + text.substring(end);
          cursorOffset = start + 1;
        }
        break;

      case "quote":
        if (currentLine.startsWith("> ")) {
          // Remove quote
          newText =
            text.substring(0, lineStart) +
            currentLine.substring(2) +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start - 2;
        } else {
          // Add quote
          newText =
            text.substring(0, lineStart) +
            "> " +
            currentLine +
            text.substring(lineEnd === -1 ? text.length : lineEnd);
          cursorOffset = start + 2;
        }
        break;

      case "divider":
        // Insert horizontal rule on new line
        const insertPos = lineEnd === -1 ? text.length : lineEnd;
        newText =
          text.substring(0, insertPos) +
          "\n\n---\n\n" +
          text.substring(insertPos);
        cursorOffset = insertPos + 6;
        break;

      case "link":
        if (selectedText) {
          newText =
            text.substring(0, start) +
            `[${selectedText}](url)` +
            text.substring(end);
          cursorOffset = start + selectedText.length + 3;
        } else {
          newText =
            text.substring(0, start) +
            "[link text](url)" +
            text.substring(end);
          cursorOffset = start + 1;
        }
        break;

      default:
        return;
    }

    // Update content
    onContentChange(newText);

    // Set cursor position after React updates
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorOffset, cursorOffset);
    }, 0);
  };

  const ToolbarButton = ({
    icon: Icon,
    onClick,
    label,
  }: {
    icon: React.ElementType;
    onClick: () => void;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg hover:bg-accent transition-colors"
      aria-label={label}
      title={label}
    >
      <Icon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
    </button>
  );

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />
  );

  return (
    <div className="border-b bg-background sticky top-0 z-10">
      <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-hide">
        {/* Text formatting */}
        <ToolbarButton
          icon={Bold}
          onClick={() => insertMarkdown("bold")}
          label="Bold"
        />
        <ToolbarButton
          icon={Italic}
          onClick={() => insertMarkdown("italic")}
          label="Italic"
        />
        <ToolbarButton
          icon={Strikethrough}
          onClick={() => insertMarkdown("strikethrough")}
          label="Strikethrough"
        />

        <ToolbarDivider />

        {/* Headings - hide H2 on mobile to save space */}
        <ToolbarButton
          icon={Heading1}
          onClick={() => insertMarkdown("h1")}
          label="Heading 1"
        />
        {!isMobile && (
          <ToolbarButton
            icon={Heading2}
            onClick={() => insertMarkdown("h2")}
            label="Heading 2"
          />
        )}

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          icon={List}
          onClick={() => insertMarkdown("bullet")}
          label="Bullet List"
        />
        <ToolbarButton
          icon={ListOrdered}
          onClick={() => insertMarkdown("number")}
          label="Numbered List"
        />
        <ToolbarButton
          icon={CheckSquare}
          onClick={() => insertMarkdown("checkbox")}
          label="Checkbox"
        />

        <ToolbarDivider />

        {/* Other formatting - conditionally show on desktop */}
        <ToolbarButton
          icon={Code}
          onClick={() => insertMarkdown("code")}
          label="Code"
        />
        {!isMobile && (
          <>
            <ToolbarButton
              icon={Quote}
              onClick={() => insertMarkdown("quote")}
              label="Quote"
            />
            <ToolbarButton
              icon={Link}
              onClick={() => insertMarkdown("link")}
              label="Link"
            />
            <ToolbarButton
              icon={Minus}
              onClick={() => insertMarkdown("divider")}
              label="Divider"
            />
          </>
        )}
      </div>
    </div>
  );
}
