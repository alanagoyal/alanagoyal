import React from 'react';
import { Pin, PinOff, Trash2, Edit } from "lucide-react";

interface SwipeActionsProps {
  isOpen: boolean;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isPinned: boolean;
  canEditOrDelete: boolean;
}

export function SwipeActions({
  isOpen,
  onPin,
  onEdit,
  onDelete,
  isPinned,
  canEditOrDelete,
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
        {isPinned ? <PinOff size={20} /> : <Pin size={20} />}
      </button>
      {canEditOrDelete && (
        <>
          <button
            onClick={onEdit}
            className="bg-[#787BFF] text-white p-2 h-full w-16 flex items-center justify-center"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={onDelete}
            className="bg-[#FF4539] text-white p-2 h-full w-16 flex items-center justify-center"
          >
            <Trash2 size={20} />
          </button>
        </>
      )}
    </div>
  );
}