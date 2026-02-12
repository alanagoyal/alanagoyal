"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { useMobileDetect } from "./mobile-detector";
import { Lock } from "lucide-react";
import { Note } from "@/lib/notes/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Icons } from "./icons";
import { getDisplayDateByCategory } from "@/lib/notes/note-utils";

export default function NoteHeader({
  note,
  saveNote,
  canEdit,
  onBack,
}: {
  note: Note;
  saveNote: (updates: Partial<Note>) => void;
  canEdit: boolean;
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

  const isMobile = useMobileDetect();
  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  const effectiveTheme = theme === "system" ? systemTheme : theme;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerLoaded, setEmojiPickerLoaded] = useState(false);
  const [emojiPickerLoading, setEmojiPickerLoading] = useState(false);
  const [PickerComponent, setPickerComponent] = useState<React.ComponentType<EmojiPickerProps> | null>(null);
  const [emojiData, setEmojiData] = useState<unknown>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [formattedDate, setFormattedDate] = useState("");
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const displayDate = getDisplayDateByCategory(note.category, note.id);
    setFormattedDate(
      format(displayDate, "MMMM d, yyyy 'at' h:mm a")
    );
  }, [note.category, note.id]);

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

  return (
    <>
      {isMobile && pathname !== "/notes" && (
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
        <div className="flex justify-center items-center">
          <p className="text-muted-foreground text-xs">{formattedDate}</p>
          <div className="ml-2 h-6 flex items-center">
            {!note.public && (
              <Badge className="text-xs justify-center items-center">
                <Lock className="w-3 h-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center relative">
          {canEdit && !note.public && !isMobile ? (
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
          {note.public || !canEdit ? (
            <span className="text-2xl font-bold flex-grow py-2 leading-normal min-h-[50px]">
              {note.title}
            </span>
          ) : (
            <Input
              id="title"
              value={note.title}
              className="bg-background placeholder:text-muted-foreground text-2xl font-bold flex-grow py-2 leading-normal min-h-[50px]"
              placeholder="Your title here..."
              onChange={handleTitleChange}
              autoFocus={!note.title}
            />
          )}
        </div>
        {showEmojiPicker && !isMobile && !note.public && canEdit && typeof document !== "undefined" &&
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
