"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Input } from "./ui/input";
import EmojiPicker from "emoji-picker-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export default function NewNoteHeader({
  note,
  setTitle,
  setEmoji,
}: {
  note: any;
  setTitle: (title: string) => void;
  setEmoji: (emoji: string) => void;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [displayEmoji, setDisplayEmoji] = useState("😊");

  useEffect(() => {
    if (note.emoji) {
      setDisplayEmoji(note.emoji);
    }
  }, [note.emoji]);

  const formattedDate = format(
    parseISO(note.created_at),
    "MMMM d, yyyy 'at' h:mm a"
  );

  const handleEmojiSelect = (emojiObject: any) => {
    setDisplayEmoji(emojiObject.emoji);
    setEmoji(emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-[#1e1e1e] mb-4">
      <p className="text-center text-muted-foreground text-xs">
        {formattedDate}
      </p>
      <div className="flex justify-between items-center">
        <Input
          className="placeholder:text-muted-foreground text-lg font-bold flex-grow mr-2"
          placeholder="Your title here..."
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {displayEmoji}
            </TooltipTrigger>
            <TooltipContent className="bg-[#1e1e1e] text-muted-foreground border-none">
              Click to choose an emoji
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {showEmojiPicker && <EmojiPicker onEmojiClick={handleEmojiSelect} />}
    </div>
  );
}
