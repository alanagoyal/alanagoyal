"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Check, Link2, Lock, Share } from "lucide-react";
import { Note } from "@/lib/notes/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Icons } from "./icons";
import { getDisplayCreatedAt } from "@/lib/notes/display-created-at";
import { getPublicNoteUrl } from "@/lib/notes/share-link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const TIMESTAMP_PLACEHOLDER = "September 30, 2026 at 11:59 PM";
const PRIVATE_BADGE_CLASS =
  "text-xs justify-center items-center bg-muted-foreground/70 can-hover:hover:bg-muted-foreground/70 text-white/90";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}

export default function NoteHeader({
  note,
  saveNote,
  canEdit,
  isMobile,
  onBack,
}: {
  note: Note;
  saveNote: (updates: Partial<Note>) => void;
  canEdit: boolean;
  isMobile?: boolean;
  onBack?: () => void; // Callback for back navigation in shell mode
}) {
  type EmojiPickerProps = {
    data: unknown;
    onEmojiSelect?: (emojiObject: { native: string }) => void;
    autoFocus?: boolean;
    searchPosition?: "top" | "bottom" | "none";
    onClickOutside?: () => void;
    theme?: "light" | "dark" | "auto";
  };

  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  const effectiveTheme = theme === "system" ? systemTheme : theme;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerLoaded, setEmojiPickerLoaded] = useState(false);
  const [emojiPickerLoading, setEmojiPickerLoading] = useState(false);
  const [PickerComponent, setPickerComponent] = useState<React.ComponentType<EmojiPickerProps> | null>(null);
  const [emojiData, setEmojiData] = useState<unknown>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [hasMounted, setHasMounted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const copyStatusTimerRef = useRef<number | null>(null);

  const loadEmojiPicker = useCallback(async () => {
    if (emojiPickerLoaded || emojiPickerLoading) return;
    setEmojiPickerLoading(true);
    try {
      const [pickerModule, dataModule] = await Promise.all([
        import("@emoji-mart/react"),
        import("@emoji-mart/data"),
      ]);
      setPickerComponent(() => pickerModule.default);
      setEmojiData(dataModule.default);
      setEmojiPickerLoaded(true);
    } catch (error) {
      console.error("Failed to load emoji picker modules:", error);
    } finally {
      setEmojiPickerLoading(false);
    }
  }, [emojiPickerLoaded, emojiPickerLoading]);

  // Focus title input when canEdit becomes true on a new (untitled) note.
  useEffect(() => {
    if (canEdit && !note.title) {
      titleInputRef.current?.focus();
    }
  }, [canEdit, note.title]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setShareOpen(false);
    setCopyStatus("idle");
  }, [note.slug]);

  useEffect(() => {
    return () => {
      if (copyStatusTimerRef.current !== null) {
        window.clearTimeout(copyStatusTimerRef.current);
      }
    };
  }, []);

  const formattedDate = useMemo(() => {
    // Render timestamps only after client mount to avoid SSR/client
    // timezone differences on refresh.
    if (!hasMounted) {
      return "";
    }

    const displayDate = new Date(getDisplayCreatedAt(note));
    return format(displayDate, "MMMM d, yyyy 'at' h:mm a");
  }, [note, hasMounted]);

  const handleEmojiSelect = (emojiObject: { native: string }) => {
    const newEmoji = emojiObject.native;
    saveNote({ emoji: newEmoji });
    setShowEmojiPicker(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveNote({ title: e.target.value });
  };

  const handleCopyLink = async () => {
    const url = getPublicNoteUrl(window.location.origin, note.slug);
    setCopyStatus((await copyText(url)) ? "copied" : "failed");

    if (copyStatusTimerRef.current !== null) {
      window.clearTimeout(copyStatusTimerRef.current);
    }
    copyStatusTimerRef.current = window.setTimeout(() => {
      setCopyStatus("idle");
      copyStatusTimerRef.current = null;
    }, 5000);
  };

  const updatePickerPosition = useCallback(() => {
    if (!emojiButtonRef.current) return;
    const rect = emojiButtonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const pickerWidth = 352;
    const margin = 8;
    const left = Math.min(
      Math.max(margin, rect.left),
      Math.max(margin, viewportWidth - pickerWidth - margin)
    );
    setPickerPosition({ top: rect.bottom + 8, left });
  }, []);

  useEffect(() => {
    if (!showEmojiPicker) return;
    updatePickerPosition();
    window.addEventListener("resize", updatePickerPosition);
    window.addEventListener("scroll", updatePickerPosition, true);
    return () => {
      window.removeEventListener("resize", updatePickerPosition);
      window.removeEventListener("scroll", updatePickerPosition, true);
    };
  }, [showEmojiPicker, updatePickerPosition]);

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsidePicker = pickerRef.current?.contains(target);
      const clickedEmojiButton = emojiButtonRef.current?.contains(target);
      if (!clickedInsidePicker && !clickedEmojiButton) {
        setShowEmojiPicker(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showEmojiPicker]);

  const isMobileView = isMobile === true;
  const showBackButton = Boolean(onBack) || (isMobileView && pathname !== "/notes");
  const backControl = showBackButton ? (
    onBack ? (
      <button onClick={onBack} className="flex h-10 items-center">
        <Icons.back />
        <span className="ml-1 text-base text-[#e2a727]">Notes</span>
      </button>
    ) : (
      <Link href="/notes" className="flex h-10 items-center">
        <Icons.back />
        <span className="ml-1 text-base text-[#e2a727]">Notes</span>
      </Link>
    )
  ) : null;
  const shareControl = note.public ? (
    <div className="relative z-20">
      <Popover open={shareOpen} onOpenChange={setShareOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Share ${note.title}`}
            aria-haspopup="menu"
            aria-expanded={shareOpen}
            onMouseDown={(event) => event.stopPropagation()}
            className={`flex items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E2A727] ${
              shareOpen
                ? "bg-foreground/10"
                : "can-hover:hover:bg-foreground/10"
            } ${
              copyStatus === "copied" ? "text-green-600" : "text-[#E2A727]"
            } ${isMobileView ? "h-10 w-10" : "h-7 w-7"}`}
          >
            {copyStatus === "copied" ? (
              <Check className="h-5 w-5" aria-hidden />
            ) : (
              <Share className="h-5 w-5" aria-hidden />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={6}
          className="w-44 rounded-xl border border-black/10 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95"
        >
          <div role="menu" aria-label={`Share ${note.title}`}>
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleCopyLink()}
              className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] leading-5 outline-none transition-colors can-hover:hover:bg-[#FFE390] can-hover:hover:text-black focus-visible:bg-[#FFE390] focus-visible:text-black focus-visible:outline-none dark:can-hover:hover:bg-[#9D7D28] dark:can-hover:hover:text-white dark:focus-visible:bg-[#9D7D28] dark:focus-visible:text-white"
            >
              {copyStatus === "copied" ? (
                <Check
                  className="h-4 w-4 shrink-0 text-green-600"
                  strokeWidth={1.8}
                  aria-hidden
                />
              ) : (
                <Link2
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.8}
                  aria-hidden
                />
              )}
              <span>
                {copyStatus === "copied"
                  ? "Copied"
                  : copyStatus === "failed"
                    ? "Copy failed"
                    : "Copy Link"}
              </span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {copyStatus !== "idle" && (
        <span
          role="status"
          className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-md border border-muted-foreground/15 bg-background/95 px-2 py-1 text-xs font-medium shadow-md backdrop-blur-xl"
        >
          {copyStatus === "copied" ? "Link copied" : "Couldn’t copy link"}
        </span>
      )}
    </div>
  ) : null;

  return (
    <>
      {isMobileView && (backControl || shareControl) && (
        <div className="flex items-center justify-between px-2 pt-2">
          {backControl ?? <span className="h-10 w-10" aria-hidden />}
          {shareControl}
        </div>
      )}
      {!isMobileView && backControl}
      <div className="px-2 mb-4 relative">
        <div className="relative flex min-h-6 items-center justify-center">
          {!note.public && isMobileView && (
            <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-1">
              <Badge className={PRIVATE_BADGE_CLASS}>
                <Lock className="w-3 h-3 mr-1" />
                Private
              </Badge>
            </div>
          )}
          <p suppressHydrationWarning className="text-muted-foreground text-xs">
            <span className={hasMounted ? "visible" : "invisible"}>
              {hasMounted ? formattedDate : TIMESTAMP_PLACEHOLDER}
            </span>
          </p>
          {!isMobileView && (
            <div className="ml-2 flex h-6 items-center">
              <Badge
                className={`${PRIVATE_BADGE_CLASS} ${note.public ? "invisible" : "visible"}`}
                aria-hidden={note.public}
              >
                <Lock className="w-3 h-3 mr-1" />
                Private
              </Badge>
            </div>
          )}
          {!isMobileView && shareControl && (
            <div className="absolute right-0 top-1/2 z-20 -translate-y-1/2">
              {shareControl}
            </div>
          )}
        </div>
        <div className="flex items-center relative">
          {canEdit && !note.public && !isMobileView ? (
            <button
              ref={emojiButtonRef}
              onClick={async () => {
                const nextOpenState = !showEmojiPicker;
                if (nextOpenState) {
                  await loadEmojiPicker();
                  updatePickerPosition();
                }
                setShowEmojiPicker(nextOpenState);
              }}
              onMouseEnter={() => {
                void loadEmojiPicker();
              }}
              onFocus={() => {
                void loadEmojiPicker();
              }}
              className="cursor-pointer mr-2"
            >
              {note.emoji}
            </button>
          ) : (
            <span className="mr-2">{note.emoji}</span>
          )}
          {note.public ? (
            <span className="text-2xl font-bold flex-grow py-2 leading-normal min-h-[50px]">
              {note.title}
            </span>
          ) : (
            <Input
              ref={titleInputRef}
              id="title"
              value={note.title}
              readOnly={!canEdit}
              className="bg-background placeholder:text-muted-foreground text-2xl font-bold flex-grow py-2 leading-normal min-h-[50px]"
              placeholder={canEdit ? "Your title here..." : ""}
              onChange={canEdit ? handleTitleChange : undefined}
            />
          )}
        </div>
        {showEmojiPicker && !isMobileView && !note.public && canEdit && typeof document !== "undefined" &&
          createPortal(
            <div
              ref={pickerRef}
              className="fixed z-[300]"
              style={{ top: `${pickerPosition.top}px`, left: `${pickerPosition.left}px` }}
            >
              {PickerComponent && emojiData ? (
                <PickerComponent
                  data={emojiData}
                  onEmojiSelect={handleEmojiSelect}
                  autoFocus={true}
                  searchPosition="top"
                  theme={effectiveTheme === "dark" ? "dark" : "light"}
                  onClickOutside={() => setShowEmojiPicker(false)}
                />
              ) : (
                <div className="h-[435px] w-[352px] rounded-lg border border-muted-foreground/20 bg-background/90" />
              )}
            </div>,
            document.body
          )}
      </div>
    </>
  );
}
