"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { Note } from "@/lib/notes/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Icons } from "./icons";
import { getDisplayCreatedAt } from "@/lib/notes/display-created-at";

const TIMESTAMP_PLACEHOLDER = "September 30, 2026 at 11:59 PM";

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
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      {showBackButton && (
        onBack ? (
          <button onClick={onBack} className="pt-2 flex items-center">
            <Icons.back />
            <span className="text-[#e2a727] text-base ml-1">Notes</span>
          </button>
        ) : (
          <Link href="/notes">
            <button className="pt-2 flex items-center">
              <Icons.back />
              <span className="text-[#e2a727] text-base ml-1">Notes</span>
            </button>
          </Link>
        )
      )}
      <div className="px-2 mb-4 relative">
        <div className="relative flex justify-center items-center">
          {!note.public && (
            <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-1">
              <Badge className="text-xs justify-center items-center">
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
