"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Input } from "./ui/input";
import EmojiPicker from "emoji-picker-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { debounce } from 'lodash';

export default function NewNoteHeader({
  note,
  saveNote,
}: {
  note: any;
  saveNote: (updates: any) => void;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [localEmoji, setLocalEmoji] = useState(note.emoji);
  const [localTitle, setLocalTitle] = useState(note.title);
  useEffect(() => {
    if (note.emoji) {
      setLocalEmoji(note.emoji);
    }
  }, [note.emoji]);

  const formattedDate = format(
    parseISO(note.created_at),
    "MMMM d, yyyy 'at' h:mm a"
  );

  const handleEmojiSelect = (emojiObject: any) => {
    setLocalEmoji(emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    debouncedSave(newTitle, localEmoji);
  };

  const debouncedSave = debounce((title, emoji) => {
    saveNote({ title, emoji });
  });

  useEffect(() => {
    debouncedSave(note.title, localEmoji);
  }, [note.title, localEmoji]);

  return (
    <div className="bg-[#1e1e1e] mb-4">
      <p className="text-center text-muted-foreground text-xs">
        {formattedDate}
      </p>
      <div className="flex justify-between items-center">
        <Input
          value={localTitle}
          className="placeholder:text-muted-foreground text-lg font-bold flex-grow mr-2 focus-visible:ring-transparent"
          placeholder="Your title here..."
          onChange={handleTitleChange}
          autoFocus
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {localEmoji}
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
