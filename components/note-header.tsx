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
import { useMobileDetect } from "./mobile-detector";
import { ChevronLeft, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function NoteHeader({
  note,
  saveNote,
  canEdit,
}: {
  note: any;
  saveNote: (updates: Partial<typeof note>) => void;
  canEdit: boolean;
}) {
  const isMobile = useMobileDetect();
  const pathname = usePathname();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(
      format(parseISO(note.created_at), "MMMM d, yyyy 'at' h:mm a")
    );
  }, [note.created_at]);

  const handleEmojiSelect = (emojiObject: any) => {
    const newEmoji = emojiObject.native;
    saveNote({ emoji: newEmoji });
    setShowEmojiPicker(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveNote({ title: e.target.value });
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
      <div className="px-2 bg-[#1c1c1c] mb-4 relative">
        <div className="flex justify-center items-center">
          <p className="text-gray-400 text-xs">{formattedDate}</p>
          {!note.public && (
            <Badge className="text-xs justify-center items-center ml-2">
              <Lock className="w-3 h-3 mr-1" />
              Private
            </Badge>
          )}
        </div>
        <div className="flex justify-between items-center">
          {note.public || !canEdit ? (
            <span className="text-2xl font-bold flex-grow mr-2 py-2 leading-normal min-h-[50px]">
              {note.title}
            </span>
          ) : (
            <Input
              id="title"
              value={note.title}
              className="placeholder:text-gray-400 text-2xl font-bold flex-grow mr-2 py-2 leading-normal min-h-[50px]"
              placeholder="Your title here..."
              onChange={handleTitleChange}
              autoFocus={!note.title}
            />
          )}
          {canEdit && !note.public && !isMobile ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="cursor-pointer"
                >
                  {note.emoji}
                </TooltipTrigger>
                <TooltipContent className="bg-[#1c1c1c] text-gray-400 border-none">
                  Select an emoji
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span>{note.emoji}</span>
          )}
        </div>
        {showEmojiPicker && !isMobile && !note.public && canEdit && (
          <div className="absolute top-full right-0 z-10">
            <Picker
              onEmojiSelect={handleEmojiSelect}
              autoFocus={true}
              searchPosition="top"
              onClickOutside={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}