import React, { useEffect } from "react";
import Link from "next/link";
import { useMobileDetect } from "@/components/mobile-detector";
import { SwipeActions } from "./swipe-actions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { Note } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";
import { useSpring, animated, config } from "react-spring";
import { useDrag } from "@use-gesture/react";

function previewContent(content: string): string {
  return content
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
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
}

export function NoteItem({
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
}: NoteItemProps) {
  const isMobile = useMobileDetect();
  const isSwipeOpen = openSwipeItemSlug === item.slug;
  const [{ x }, api] = useSpring(() => ({
    x: 0,
    config: { tension: 500, friction: 30, clamp: true },
  }));

  const canEditOrDelete = item.session_id === sessionId;
  const buttonCount = 1 + (canEditOrDelete ? 2 : 0);
  const buttonWidth = 64;
  const threshold = -buttonWidth * buttonCount;

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx], last }) => {
      const currentX = x.get();
      const projectedEndpoint = currentX + vx * 0.2;

      if (down) {
        api.start({
          x: Math.max(threshold, Math.min(0, currentX + mx)),
          immediate: true,
        });
      } else {
        const shouldOpen =
          projectedEndpoint < threshold / 2 || (dx < 0 && Math.abs(vx) > 0.5);

        api.start({
          x: shouldOpen ? threshold : 0,
          immediate: false,
          config: { tension: 500, friction: 30, clamp: true },
        });

        if (last) {
          setOpenSwipeItemSlug(shouldOpen ? item.slug : null);
        }
      }
    },
    {
      axis: "x",
      bounds: { left: threshold, right: 0 },
      rubberband: true,
      from: () => [x.get(), 0],
      filterTaps: true,
      threshold: 5,
    }
  );

  useEffect(() => {
    if (openSwipeItemSlug !== item.slug) {
      api.start({
        x: 0,
        immediate: false,
        config: { tension: 500, friction: 30, clamp: true },
      });
    }
  }, [openSwipeItemSlug, item.slug, api]);

  const handleDelete = async () => {
    setOpenSwipeItemSlug(null);
    api.start({ x: 0 });
    await handleNoteDelete(item);
  };

  const handleEdit = () => {
    setOpenSwipeItemSlug(null);
    api.start({ x: 0 });
    onNoteEdit(item.slug);
  };

  const handlePinAction = () => {
    handlePinToggle(item.slug);
    setOpenSwipeItemSlug(null);
    api.start({ x: 0 });
  };

  const handleNoteClick = () => {
    if (onNoteSelect) {
      onNoteSelect(item);
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
          {previewContent(item.content)}
        </p>
      </Link>
    </li>
  );

  if (isMobile) {
    return (
      <div className="relative overflow-hidden touch-pan-y">
        <animated.div {...bind()} style={{ x, touchAction: "pan-y" }}>
          {NoteContent}
        </animated.div>
        <SwipeActions
          onPin={handlePinAction}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isPinned={isPinned}
          canEditOrDelete={canEditOrDelete}
          x={x}
          threshold={threshold}
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
          {canEditOrDelete && (
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
