import React from 'react';
import { Pin, PinOff, Trash2, Edit } from "lucide-react";
import { animated, useSpring } from 'react-spring';

interface SwipeActionsProps {
  isOpen: boolean;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isPinned: boolean;
  canEditOrDelete: boolean;
  x: any; // This is the animated value from react-spring
  threshold: number; // Added threshold prop
}

export function SwipeActions({
  isOpen,
  onPin,
  onEdit,
  onDelete,
  isPinned,
  canEditOrDelete,
  x,
  threshold, // Use threshold prop
}: SwipeActionsProps) {
  return (
    <animated.div
      className="absolute top-0 right-0 h-full flex items-center"
      style={{
        width: `${-threshold}px`, // Use threshold for width
        transform: x.to((x: number) => `translateX(${x + -threshold}px)`), // Adjust translation
      }}
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
    </animated.div>
  );
}