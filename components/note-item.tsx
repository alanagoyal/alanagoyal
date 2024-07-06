import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { createClient } from "@/utils/supabase/client";
import { useMobileDetect } from "@/components/mobile-detector";
import { SwipeActions } from "./swipe-actions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { Note } from '@/lib/types';

interface NoteItemProps {
  item: Note;
  selectedNoteSlug: string | null;
  sessionId: string;
  onNoteSelect: (note: Note) => void;
  groupedNotes: Record<string, Note[]>;
  categoryOrder: string[];
  togglePinned: (slug: string) => void;
  isPinned: boolean;
  isHighlighted: boolean;
  isSearching: boolean;
  onNoteDelete: (slug: string) => void;
  onNoteEdit: (slug: string) => void;
  router: any;
}

export function NoteItem({
  item,
  selectedNoteSlug,
  sessionId,
  onNoteSelect,
  groupedNotes,
  categoryOrder,
  togglePinned,
  isPinned,
  isHighlighted,
  isSearching,
  onNoteDelete,
  onNoteEdit,
  router,
}: NoteItemProps) {
  const supabase = createClient();
  const isMobile = useMobileDetect();

  const [isSwiping, setIsSwiping] = useState(false);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);

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
    try {
      let nextRoute = "/";
      if (!isMobile) {
        const flattenedNotes = categoryOrder.flatMap((category) =>
          groupedNotes[category] ? groupedNotes[category] : []
        );
        const currentIndex = flattenedNotes.findIndex(
          (note) => note.slug === item.slug
        );
        const nextNote =
          flattenedNotes[currentIndex - 1] || flattenedNotes[currentIndex + 1];
        nextRoute = nextNote ? `/${nextNote.slug}` : "/about-me";
      }

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("slug", item.slug)
        .eq("session_id", sessionId);

      if (error) {
        throw error;
      }

      onNoteDelete(item.slug);
      setIsSwipeOpen(false);
      router.push(nextRoute);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleEdit = () => {
    setIsSwipeOpen(false);
    onNoteEdit(item.slug);
  };

  const handlePinToggle = () => {
    togglePinned(item.slug);
    setIsSwipeOpen(false);
    router.push(`/${item.slug}`);
  };

  const canEditOrDelete = item.session_id === sessionId;

  const handleNoteClick = () => {
    if (onNoteSelect) {
      onNoteSelect(item);
    }
  };

  const handleSwipeAction = (action: () => void) => {
    if (isSwipeOpen) {
      action();
    }
  };

  const NoteContent = (
    <li
      className={`min-h-[50px] ${
        (!isMobile && isSearching && isHighlighted) ||
        (!isSearching && item.slug === selectedNoteSlug)
          ? "bg-[#9D7D28] rounded-md"
          : ""
      }`}
      onClick={handleNoteClick}
    >
      <Link href={`/${item.slug || ""}`} prefetch={true} className="block py-2">
        <h2 className="text-sm font-bold pl-4 pr-4 break-words">
          {item.emoji} {item.title}
        </h2>
        <p
          className={`text-xs pl-4 pr-4 overflow-hidden text-ellipsis whitespace-nowrap ${
            (!isMobile && isSearching && isHighlighted) ||
            (!isSearching && item.slug === selectedNoteSlug)
              ? "text-gray-300"
              : "text-gray-400"
          }`}
        >
          <span className="text-white">
            {new Date(item.created_at).toLocaleDateString("en-US")}
          </span>{" "}
          {item.content.trim().replace(/[#_*~`>+\[\]!()-]/g, " ")}
        </p>
      </Link>
    </li>
  );

  const handlers = useSwipeable({
    onSwipeStart: () => setIsSwiping(true),
    onSwiped: () => setIsSwiping(false),
    onSwipedLeft: () => {
      setIsSwipeOpen(true);
      setIsSwiping(false);
    },
    onSwipedRight: () => {
      setIsSwipeOpen(false);
      setIsSwiping(false);
    },
    trackMouse: true,
  });

  if (isMobile) {
    return (
      <div {...handlers} className="relative overflow-hidden">
        <div
          className={`transition-transform duration-300 ease-out ${
            isSwipeOpen ? "transform -translate-x-24" : ""
          }`}
        >
          {NoteContent}
        </div>
        <SwipeActions
          isOpen={isSwipeOpen}
          onPin={() => handleSwipeAction(handlePinToggle)}
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
          <ContextMenuItem onClick={handlePinToggle} className="cursor-pointer">
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
}