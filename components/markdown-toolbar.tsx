"use client";

import { useRef } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Trash2,
  PenSquare,
  Type,
  CheckSquare,
  Table,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Circle,
} from "lucide-react";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onContentChange: (content: string) => void;
  content: string;
  onDelete?: () => void;
  onNewNote?: () => void;
  canEdit: boolean;
}

export default function MarkdownToolbar({
  textareaRef,
  onContentChange,
  content,
  onDelete,
  onNewNote,
  canEdit,
}: MarkdownToolbarProps) {
  const insertMarkdown = (
    before: string,
    after: string = "",
    placeholder: string = ""
  ) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newContent =
      content.substring(0, start) +
      before +
      textToInsert +
      after +
      content.substring(end);

    onContentChange(newContent);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLineStart = (prefix: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find the start of the current line
    const beforeCursor = content.substring(0, start);
    const lineStart = beforeCursor.lastIndexOf("\n") + 1;

    // Check if the line already has this prefix
    const currentLine = content.substring(lineStart, end || start);
    const hasPrefix = currentLine.trimStart().startsWith(prefix.trim());

    let newContent: string;
    let newCursorPos: number;

    if (hasPrefix) {
      // Remove the prefix
      const lineWithoutPrefix = currentLine.replace(
        new RegExp(`^\\s*${prefix.trim()}\\s*`),
        ""
      );
      newContent =
        content.substring(0, lineStart) +
        lineWithoutPrefix +
        content.substring(end || start);
      newCursorPos = lineStart + lineWithoutPrefix.length;
    } else {
      // Add the prefix
      newContent =
        content.substring(0, lineStart) +
        prefix +
        content.substring(lineStart);
      newCursorPos = start + prefix.length;
    }

    onContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const applyTextStyle = (style: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;

    switch (style) {
      case "bold":
        insertMarkdown("**", "**", "bold text");
        break;
      case "italic":
        insertMarkdown("*", "*", "italic text");
        break;
      case "underline":
        insertMarkdown("<u>", "</u>", "underlined text");
        break;
      case "strikethrough":
        insertMarkdown("~~", "~~", "strikethrough text");
        break;
      case "title":
        insertLineStart("# ");
        break;
      case "heading":
        insertLineStart("## ");
        break;
      case "subheading":
        insertLineStart("### ");
        break;
      case "body":
        // Remove any heading markers
        const beforeCursor = content.substring(0, start);
        const lineStart = beforeCursor.lastIndexOf("\n") + 1;
        const lineEnd = content.indexOf("\n", start);
        const currentLine = content.substring(
          lineStart,
          lineEnd === -1 ? content.length : lineEnd
        );
        const cleanLine = currentLine.replace(/^#+\s*/, "");
        const newContent =
          content.substring(0, lineStart) +
          cleanLine +
          content.substring(lineEnd === -1 ? content.length : lineEnd);
        onContentChange(newContent);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start);
        }, 0);
        break;
      case "monostyled":
        insertMarkdown("`", "`", "code");
        break;
      case "bulleted":
        insertLineStart("- ");
        break;
      case "dashed":
        insertLineStart("- ");
        break;
      case "numbered":
        insertLineStart("1. ");
        break;
      case "quote":
        insertLineStart("> ");
        break;
    }
  };

  const insertChecklist = () => {
    insertLineStart("- [ ] ");
  };

  const insertTable = () => {
    const tableTemplate = `| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

`;
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;

    const newContent =
      content.substring(0, start) + tableTemplate + content.substring(start);

    onContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start);
    }, 0);
  };

  if (!canEdit) return null;

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border/40">
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <div className="flex items-center gap-0.5">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Delete note"
            >
              <Trash2 className="h-[18px] w-[18px]" />
            </Button>
          )}
          {onNewNote && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewNote}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="New note"
            >
              <PenSquare className="h-[18px] w-[18px]" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {/* Text Styles Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors font-serif font-semibold"
                title="Text styles"
              >
                <span className="text-base">Aa</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 bg-popover/95 backdrop-blur-md border-border/50 shadow-lg"
            >
              <div className="flex items-center justify-around gap-1 px-3 py-2.5 border-b border-border/50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => applyTextStyle("bold")}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="Bold"
                >
                  <Bold className="h-[15px] w-[15px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => applyTextStyle("italic")}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="Italic"
                >
                  <Italic className="h-[15px] w-[15px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => applyTextStyle("underline")}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="Underline"
                >
                  <Underline className="h-[15px] w-[15px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => applyTextStyle("strikethrough")}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="Strikethrough"
                >
                  <Strikethrough className="h-[15px] w-[15px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/40 cursor-not-allowed"
                  title="Highlight (coming soon)"
                  disabled
                >
                  <Highlighter className="h-[15px] w-[15px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/40 cursor-not-allowed"
                  title="Color (coming soon)"
                  disabled
                >
                  <Circle className="h-[15px] w-[15px]" fill="currentColor" />
                </Button>
              </div>

              <DropdownMenuItem
                onClick={() => applyTextStyle("title")}
                className="text-2xl font-bold py-3 px-4 cursor-pointer hover:bg-muted/60"
              >
                Title
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applyTextStyle("heading")}
                className="text-xl font-bold py-3 px-4 cursor-pointer hover:bg-muted/60"
              >
                Heading
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applyTextStyle("subheading")}
                className="text-lg font-semibold py-2.5 px-4 cursor-pointer hover:bg-muted/60"
              >
                Subheading
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applyTextStyle("body")}
                className="text-base py-2.5 px-4 cursor-pointer hover:bg-muted/60"
              >
                Body
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applyTextStyle("monostyled")}
                className="font-mono py-2.5 px-4 cursor-pointer hover:bg-muted/60"
              >
                Monostyled
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={() => applyTextStyle("bulleted")}
                className="py-2.5 px-4 cursor-pointer hover:bg-muted/60"
              >
                <span className="mr-3">•</span> Bulleted List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applyTextStyle("dashed")}
                className="py-2.5 px-4 cursor-pointer hover:bg-muted/60"
              >
                <span className="mr-3">-</span> Dashed List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applyTextStyle("numbered")}
                className="py-2.5 px-4 cursor-pointer hover:bg-muted/60"
              >
                <span className="mr-3">1.</span> Numbered List
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={() => applyTextStyle("quote")}
                className="py-2.5 px-4 cursor-pointer hover:bg-muted/60 italic"
              >
                <span className="mr-3">|</span> Block Quote
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Checklist Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={insertChecklist}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Checklist"
          >
            <CheckSquare className="h-[18px] w-[18px]" />
          </Button>

          {/* Table Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={insertTable}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Table"
          >
            <Table className="h-[18px] w-[18px]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
