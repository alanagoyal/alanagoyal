import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSwipeable } from "react-swipeable";
import { useMobileDetect } from "@/components/apps/notes/mobile-detector";
import { SwipeActions } from "./swipe-actions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Note } from "@/lib/notes/types";
import { getDisplayCreatedAt } from "@/lib/notes/display-created-at";
import { Dispatch, SetStateAction } from "react";

const SIDEBAR_DATE_PLACEHOLDER = "00/00/0000";

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
  useCallbackNavigation?: boolean;
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
  useCallbackNavigation = false,
}: NoteItemProps) {
  const isMobile = useMobileDetect();
  const [isSwiping, setIsSwiping] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const isSwipeOpen = openSwipeItemSlug === item.slug;

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  const noteContentInner = (
    <>
      <h2 className="text-sm font-bold px-2 break-words line-clamp-1">
        {item.emoji} {item.title}
      </h2>
      <p
        className={`text-xs pl-2 flex items-baseline gap-2 ${
          !isMobile && (
            (isSearching && isHighlighted) ||
            (!isSearching && item.slug === selectedNoteSlug)
          )
            ? "text-muted-foreground dark:text-white/80"
            : "text-muted-foreground"
        }`}
      >
        <span className="text-black dark:text-white shrink-0">
          <span
            className={`inline-block min-w-[72px] tabular-nums ${
              hasMounted ? "visible" : "invisible"
            }`}
          >
            {hasMounted
              ? new Date(getDisplayCreatedAt(item)).toLocaleDateString("en-US")
              : SIDEBAR_DATE_PLACEHOLDER}
          </span>
        </span>
        <span className="min-w-0 flex-1 truncate">
          {previewContent(item.content)}
        </span>
      </p>
    </>
  );

  const NoteContent = (
    <li
      tabIndex={0}
      className={`h-[70px] w-full ${
        !isMobile && (
          (isSearching && isHighlighted) ||
          (!isSearching && item.slug === selectedNoteSlug)
        )
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
        {useCallbackNavigation ? (
          <button
            onClick={() => onNoteSelect(item)}
            tabIndex={-1}
            className="block py-2 h-full w-full flex flex-col justify-center text-left"
          >
            {noteContentInner}
          </button>
        ) : (
          <Link
            href={`/notes/${item.slug || ""}`}
            prefetch={true}
            tabIndex={-1}
            className="block py-2 h-full w-full flex flex-col justify-center"
          >
            {noteContentInner}
          </Link>
        )}
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
