"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Input } from "./ui/input";
import Picker from "@emoji-mart/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { debounce } from "lodash";
import { useMobileDetect } from "./mobile-detector";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NoteHeader({
  note,
  saveNote,
}: {
  note: any;
  saveNote: (updates: any) => void;
}) {
  const isMobile = useMobileDetect();
  const pathname = usePathname();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [localEmoji, setLocalEmoji] = useState(note.emoji);
  const [localTitle, setLocalTitle] = useState(note.title);
  const [isPublic, setIsPublic] = useState(note.public);

  useEffect(() => {
    if (note.emoji) {
      setLocalEmoji(note.emoji);
    }
    if (note.title) {
      setLocalTitle(note.title);
    }
    setIsPublic(note.public);
  }, [note.emoji, note.title, note.public]);

  useEffect(() => {
    const debouncedSave = debounce((title: string, emoji: string) => {
      if (title !== note.title || emoji !== note.emoji) {
        saveNote({ title, emoji });
      }
    }, 1000);

    debouncedSave(localTitle, localEmoji);

    return () => debouncedSave.cancel();
  }, [localTitle, localEmoji, saveNote, note.title, note.emoji]);

  const formattedDate = format(
    parseISO(note.created_at),
    "MMMM d, yyyy 'at' h:mm a"
  );

  const handleEmojiSelect = (emojiObject: any) => {
    setLocalEmoji(emojiObject.native);
    setShowEmojiPicker(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
  };

  return (
    <>
      {isMobile && pathname !== "/" && (
        <Link href="/">
          <button className="pt-2 flex items-center">
            <ChevronLeft className="w-5 h-5 text-[#e2a727]" />
            <span className="text-[#e2a727] text-base ml-1">Notes</span>
          </button>
        </Link>
      )}
      <div className=" px-2 bg-[#1c1c1c] mb-4 relative">
        <p className="text-center text-gray-300 text-xs">{formattedDate}</p>
        <div className="flex justify-between items-center">
          {isPublic ? (
            <span className="text-2xl font-bold flex-grow mr-2 py-2 leading-normal min-h-[50px]">
              {localTitle}
            </span>
          ) : (
            <Input
              id="title"
              value={localTitle}
              className="placeholder:text-muted-foreground text-2xl font-bold flex-grow mr-2 py-2 leading-normal min-h-[50px]"
              placeholder="Your title here..."
              onChange={handleTitleChange}
              autoFocus={!note.title}
            />
          )}
          {!isPublic && !isMobile ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="cursor-pointer"
                >
                  {localEmoji}
                </TooltipTrigger>
                <TooltipContent className="bg-[#1c1c1c] text-gray-300 border-none">
                  Click to choose an emoji
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span>{localEmoji}</span>
          )}
        </div>
        {showEmojiPicker && !isMobile && !isPublic && (
          <div className="absolute top-full right-0 z-10">
            <Picker onEmojiSelect={handleEmojiSelect} />
          </div>
        )}
      </div>
    </>
  );
}
