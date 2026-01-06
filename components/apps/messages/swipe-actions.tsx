import React from 'react';
import { Icons } from './icons';

interface SwipeActionsProps {
  isOpen: boolean;
  onDelete: () => void;
  onPin: () => void;
  onHideAlerts: () => void;
  isPinned?: boolean;
  hideAlerts?: boolean;
}

export function SwipeActions({
  isOpen,
  onDelete,
  onPin,
  onHideAlerts,
  isPinned = false,
  hideAlerts = false,
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
        onClick={onHideAlerts}
        className="bg-[#5E5BE6] text-white p-2 h-full w-16 flex items-center justify-center"
      >
        {hideAlerts ? <Icons.bell size={20} className="text-white" /> : <Icons.bellOff size={20} className="text-white" />}
      </button>
      <button
        onClick={onPin}
        className="bg-[#3293FC] text-white p-2 h-full w-16 flex items-center justify-center"
      >
        <Icons.pin size={20} className={isPinned ? "rotate-45 text-white" : "text-white"} />
      </button>
      <button
        onClick={onDelete}
        className="bg-[#FF4539] text-white p-2 h-full w-16 flex items-center justify-center"
      >
        <Icons.trash size={20} className="text-white" />
      </button>
    </div>
  );
}
