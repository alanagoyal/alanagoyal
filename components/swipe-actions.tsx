import React from 'react';
import { Trash2, Pin } from "lucide-react";

interface SwipeActionsProps {
  isOpen: boolean;
  onDelete: () => void;
  onPin: () => void;
  isPinned?: boolean;
}

export function SwipeActions({
  isOpen,
  onDelete,
  onPin,
  isPinned = false,
}: SwipeActionsProps) {
  return (
    <div
      className={`absolute top-0 right-0 h-full flex items-center transition-opacity duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <button
        onClick={onPin}
        className="bg-[#3293FC] text-white p-2 h-full w-16 flex items-center justify-center"
      >
        <Pin size={20} className={isPinned ? "rotate-45" : ""} />
      </button>
      <button
        onClick={onDelete}
        className="bg-[#FF4539] text-white p-2 h-full w-16 flex items-center justify-center"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}
