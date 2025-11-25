import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSwipeable } from "react-swipeable";
import { useMobileDetect } from "@/components/mobile-detector";
import { SwipeActions } from "./swipe-actions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { Note } from "@/lib/types";
import { getDisplayDateByCategory } from "@/lib/note-utils";
import { Dispatch, SetStateAction } from "react";

function previewContent(content: string): string {
  return content
    .replace(/!\[[^\]]*\]\([^\)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/\[[ x]\]/g, "")
    .replace(/[#*_~`>+\-]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface NoteItemProps {
  item: Note;
  selectedNoteSlug: string | null;
  sessionId: string;
  onNoteSelect: (note: Note) => void;
  onNoteEdit: (slug: string) => void;
  handlePinToggle: (slug: string) => void;
  isPinned: boolean;
  isHighlighted: boolean;
  isSearching: boolean;
  handleNoteDelete: (note: Note) => Promise<void>;
  openSwipeItemSlug: string | null;
  setOpenSwipeItemSlug: Dispatch<SetStateAction<string | null>>;
  showDivider?: boolean;
}

export const NoteItem = React.memo(function NoteItem({
  item,
  selectedNoteSlug,
  sessionId,
  onNoteSelect,
  onNoteEdit,
  handlePinToggle,
  isPinned,
  isHighlighted,
  isSearching,
  handleNoteDelete,
  openSwipeItemSlug,
  setOpenSwipeItemSlug,
  showDivider = false,
}: NoteItemProps) {
  const isMobile = useMobileDetect();
  const [isSwiping, setIsSwiping] = useState(false);
  const isSwipeOpen = openSwipeItemSlug === item.slug;

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (isSwiping) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventDefault);
    };
  }, [isSwiping]);

  const handleDelete = async () => {
    setOpenSwipeItemSlug(null);
    await handleNoteDelete(item);
  };

  const handleEdit = () => {
    setOpenSwipeItemSlug(null);
    onNoteEdit(item.slug);
  };

  const handlePinAction = () => {
    handlePinToggle(item.slug);
    setOpenSwipeItemSlug(null);
  };

  const canEditOrDelete = item.session_id === sessionId;

  const handleSwipeAction = (action: () => void) => {
    if (isSwipeOpen) {
      action();
    }
  };

  const NoteContent = (
    <li
      tabIndex={0}
      className={`h-[70px] w-full ${
        (!isMobile && isSearching && isHighlighted) ||
        (!isSearching && item.slug === selectedNoteSlug)
          ? "bg-[#FFE390] dark:bg-[#9D7D28] dark:text-white rounded-md"
          : ""
      } ${
        !isMobile && showDivider &&
        (isSearching ? !isHighlighted : item.slug !== selectedNoteSlug)
          ? 'after:content-[""] after:block after:mx-2 after:border-t after:border-muted-foreground/20'
          : ""
      }`}
    >
      <div 
        data-note-slug={item.slug}
        className={`h-full w-full px-4`}
      >
        <Link
          href={`/notes/${item.slug || ""}`}
          prefetch={true}
          tabIndex={-1}
          className="block py-2 h-full w-full flex flex-col justify-center"
        >
          <h2 className="text-sm font-bold px-2 break-words line-clamp-1">
            {item.emoji} {item.title}
          </h2>
          <p
            className={`text-xs pl-2 break-words line-clamp-1 ${
              (!isMobile && isSearching && isHighlighted) ||
              (!isSearching && item.slug === selectedNoteSlug)
                ? "text-muted-foreground dark:text-white/80"
                : "text-muted-foreground"
            }`}
          >
            <span className="text-black dark:text-white">
              {getDisplayDateByCategory(item.category, item.id).toLocaleDateString("en-US")}
            </span>{" "}
            {previewContent(item.content)}
          </p>
        </Link>
      </div>
    </li>
  );

  const handlers = useSwipeable({
    onSwipeStart: () => setIsSwiping(true),
    onSwiped: () => setIsSwiping(false),
    onSwipedLeft: () => {
      setOpenSwipeItemSlug(item.slug);
      setIsSwiping(false);
    },
    onSwipedRight: () => {
      setOpenSwipeItemSlug(null);
      setIsSwiping(false);
    },
    trackMouse: true,
  });

  if (isMobile) {
    return (
      <div {...handlers} className="relative overflow-hidden">
        <div
          data-note-slug={item.slug}
          className={`transition-transform duration-300 ease-out w-full ${
            isSwipeOpen ? "transform -translate-x-24" : ""
          } ${
            showDivider
              ? 'after:content-[""] after:block after:mx-6 after:border-t after:border-muted-foreground/20'
              : ""
          }`}
        >
          {NoteContent}
        </div>
        <SwipeActions
          isOpen={isSwipeOpen}
          onPin={() => handleSwipeAction(handlePinAction)}
          onEdit={() => handleSwipeAction(handleEdit)}
          onDelete={() => handleSwipeAction(handleDelete)}
          isPinned={isPinned}
          canEditOrDelete={canEditOrDelete}
        />
      </div>
    );
  } else {
    return (
      <ContextMenu>
        <ContextMenuTrigger>{NoteContent}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handlePinAction} className="cursor-pointer">
            {isPinned ? "Unpin" : "Pin"}
          </ContextMenuItem>
          {item.session_id === sessionId && (
            <>
              <ContextMenuItem onClick={handleEdit} className="cursor-pointer">
                Edit
              </ContextMenuItem>
              <ContextMenuItem
                onClick={handleDelete}
                className="cursor-pointer"
              >
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  }
});
