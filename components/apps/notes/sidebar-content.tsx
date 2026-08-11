import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { NoteItem } from "./note-item";
import { NoteMarkdownPreview } from "./note-markdown-preview";
import { Note, NotesViewMode } from "@/lib/notes/types";
import { getDisplayCreatedAt } from "@/lib/notes/display-created-at";
import { NOTE_MARKDOWN_PREVIEW_MAX_CHARACTERS } from "@/lib/notes/markdown-preview";
import {
  canStartMobileNoteLongPress,
  didMobileNoteLongPressMove,
  isContextMenuKeyboardShortcut,
  MOBILE_NOTE_LONG_PRESS_DELAY_MS,
} from "@/lib/notes/mobile-gallery-interactions";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface SidebarContentProps {
  groupedNotes: Record<string, Note[]>;
  selectedNoteSlug: string | null;
  onNoteSelect: (note: Note) => void;
  sessionId: string;
  handlePinToggle: (
    slug: string,
    options?: { selectNote?: boolean },
  ) => void;
  pinnedNotes: Set<string>;
  localSearchResults: Note[] | null;
  highlightedIndex: number;
  categoryOrder: string[];
  labels: Record<string, React.ReactNode>;
  handleNoteDelete: (note: Note) => Promise<void>;
  openSwipeItemSlug: string | null;
  setOpenSwipeItemSlug: React.Dispatch<React.SetStateAction<string | null>>;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  useCallbackNavigation?: boolean;
  isMobile?: boolean;
  viewMode: NotesViewMode;
}

interface GalleryCardProps {
  note: Note;
  isPinned: boolean;
  onNoteSelect: (note: Note) => void;
  onPinToggle: (slug: string) => void;
  onDelete: (note: Note) => Promise<void>;
  sessionId: string;
  isMobile: boolean;
}

const MOBILE_NOTE_EXPAND_DURATION_MS = 320;

interface GalleryCardBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

function MobileGalleryNoteActions({
  note,
  isPinned,
  canDelete,
  open,
  sourceBounds,
  onOpenChange,
  onRestoreFocus,
  onOpenNote,
  onPinToggle,
  onDelete,
}: {
  note: Note;
  isPinned: boolean;
  canDelete: boolean;
  open: boolean;
  sourceBounds: GalleryCardBounds | null;
  onOpenChange: (open: boolean) => void;
  onRestoreFocus: () => void;
  onOpenNote: (note: Note) => void;
  onPinToggle: (slug: string) => void;
  onDelete: (note: Note) => Promise<void>;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      window.getSelection()?.removeAllRanges();
    }
  }, [open]);

  useLayoutEffect(() => {
    const preview = previewRef.current;
    const actions = actionsRef.current;
    if (!open || !sourceBounds || !preview || !actions) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targetBounds = preview.getBoundingClientRect();
    const translateX =
      sourceBounds.left +
      sourceBounds.width / 2 -
      (targetBounds.left + targetBounds.width / 2);
    const translateY =
      sourceBounds.top +
      sourceBounds.height / 2 -
      (targetBounds.top + targetBounds.height / 2);
    const scaleX = sourceBounds.width / targetBounds.width;
    const scaleY = sourceBounds.height / targetBounds.height;

    const previewAnimation = preview.animate(
      [
        {
          transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`,
          borderRadius: "8px",
        },
        {
          transform: "translate3d(0, 0, 0) scale(1, 1)",
          borderRadius: "28px",
        },
      ],
      {
        duration: MOBILE_NOTE_EXPAND_DURATION_MS,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "both",
      },
    );
    const actionsAnimation = actions.animate(
      [
        { opacity: 0, transform: "translateY(-10px) scale(0.97)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 170,
        delay: MOBILE_NOTE_EXPAND_DURATION_MS - 110,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "both",
      },
    );

    return () => {
      previewAnimation.cancel();
      actionsAnimation.cancel();
    };
  }, [open, sourceBounds]);

  const handlePinToggle = () => {
    onOpenChange(false);
    onPinToggle(note.slug);
  };

  const handleOpenNote = () => {
    onOpenChange(false);
    onOpenNote(note);
  };

  const handlePreviewKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    handleOpenNote();
  };

  const handleDelete = () => {
    onOpenChange(false);
    void onDelete(note);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onClick={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onRestoreFocus();
          }}
          className="fixed left-1/2 top-1/2 z-[91] w-full max-w-[560px] -translate-x-1/2 -translate-y-1/2 px-4 outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Note actions for {note.title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Preview the note, then pin, unpin, or delete it.
          </DialogPrimitive.Description>

          <div
            ref={previewRef}
            className="relative flex h-[min(52dvh,32rem)] w-full flex-col overflow-hidden rounded-[28px] border border-muted-foreground/15 bg-background p-6 text-left shadow-2xl will-change-transform"
          >
            <button
              type="button"
              aria-label={`Open ${note.title}`}
              onClick={handleOpenNote}
              onKeyDown={handlePreviewKeyDown}
              className="absolute inset-0 z-10 cursor-default rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E2A727]"
            />
            <h2 className="shrink-0 text-2xl font-bold leading-tight">
              {note.emoji} {note.title}
            </h2>
            <NoteMarkdownPreview
              content={note.content}
              expanded
              className="mt-8 min-h-0 w-full flex-1 overflow-hidden text-[17px] leading-6 text-foreground"
            />
          </div>

          <div
            ref={actionsRef}
            className="mx-auto mt-3 w-[calc(100%-3rem)] max-w-sm overflow-hidden rounded-[22px] border border-muted-foreground/15 bg-background/95 shadow-2xl backdrop-blur-xl will-change-transform"
          >
            <button
              type="button"
              onClick={handlePinToggle}
              className="flex h-14 w-full items-center gap-3 px-5 text-left text-[17px] outline-none active:bg-muted focus-visible:bg-muted"
            >
              {isPinned ? (
                <PinOff className="h-5 w-5 shrink-0" aria-hidden />
              ) : (
                <Pin className="h-5 w-5 shrink-0" aria-hidden />
              )}
              <span>{isPinned ? "Unpin Note" : "Pin Note"}</span>
            </button>
            {canDelete && (
              <>
                <div className="mx-5 border-t border-muted-foreground/20" />
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-14 w-full items-center gap-3 px-5 text-left text-[17px] text-red-600 outline-none active:bg-muted focus-visible:bg-muted"
                >
                  <Trash2 className="h-5 w-5 shrink-0" aria-hidden />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function GalleryCard({
  note,
  isPinned,
  onNoteSelect,
  onPinToggle,
  onDelete,
  sessionId,
  isMobile,
}: GalleryCardProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuSourceBounds, setContextMenuSourceBounds] =
    useState<GalleryCardBounds | null>(null);
  const cardButtonRef = useRef<HTMLButtonElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressOriginRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);
  const shouldRestoreCardFocusRef = useRef(false);
  const canDelete = note.session_id === sessionId;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressOriginRef.current = null;
  }, []);

  useEffect(() => clearLongPressTimer, [clearLongPressTimer]);

  const openMobileActions = useCallback((restoreFocus = false) => {
    const cardBounds = cardButtonRef.current?.getBoundingClientRect();
    if (cardBounds) {
      setContextMenuSourceBounds({
        top: cardBounds.top,
        left: cardBounds.left,
        width: cardBounds.width,
        height: cardBounds.height,
      });
    }
    window.getSelection()?.removeAllRanges();
    suppressNextClickRef.current = true;
    shouldRestoreCardFocusRef.current = restoreFocus;
    setIsContextMenuOpen(true);
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!isMobile || !canStartMobileNoteLongPress(event.pointerType)) return;

    clearLongPressTimer();
    suppressNextClickRef.current = false;
    longPressOriginRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      openMobileActions();
    }, MOBILE_NOTE_LONG_PRESS_DELAY_MS);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const origin = longPressOriginRef.current;
    if (!origin) return;

    if (
      didMobileNoteLongPressMove(origin, {
        x: event.clientX,
        y: event.clientY,
      })
    ) {
      clearLongPressTimer();
    }
  };

  const handlePointerEnd = () => {
    clearLongPressTimer();
  };

  const suppressClickAfterLongPress = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!suppressNextClickRef.current) return false;

    event.preventDefault();
    event.stopPropagation();
    suppressNextClickRef.current = false;
    return true;
  };

  const handleCardClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!suppressClickAfterLongPress(event)) {
      onNoteSelect(note);
    }
  };

  const handleQuickPinClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!suppressClickAfterLongPress(event)) {
      onPinToggle(note.slug);
    }
  };

  const handleMobileActionsOpenChange = (open: boolean) => {
    setIsContextMenuOpen(open);
    if (!open) suppressNextClickRef.current = false;
  };

  const restoreCardFocus = useCallback(() => {
    if (shouldRestoreCardFocusRef.current) {
      cardButtonRef.current?.focus();
      shouldRestoreCardFocusRef.current = false;
    }
  }, []);

  const handleMobileContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    openMobileActions();
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!event.repeat && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onNoteSelect(note);
      return;
    }

    if (!isMobile || !isContextMenuKeyboardShortcut(event.key, event.shiftKey)) {
      return;
    }

    event.preventDefault();
    openMobileActions(true);
  };

  const cardContent = (
    <article
      className={cn(
        "group relative min-w-0",
        isMobile && "notes-gallery-context-trigger select-none",
      )}
      onContextMenu={isMobile ? handleMobileContextMenu : undefined}
      onPointerDown={isMobile ? handlePointerDown : undefined}
      onPointerMove={isMobile ? handlePointerMove : undefined}
      onPointerUp={isMobile ? handlePointerEnd : undefined}
      onPointerCancel={isMobile ? handlePointerEnd : undefined}
    >
      <div
        className={cn(
          "flex aspect-[4/3] w-full flex-col overflow-hidden border border-muted-foreground/25 text-left shadow-sm",
          isMobile ? "bg-white dark:bg-[#1C1C1E]" : "bg-background",
          isMobile
            ? "rounded-lg px-1.5 pt-1.5"
            : "rounded-xl px-4 py-3",
        )}
      >
        <h4
          className={cn(
            "line-clamp-2 font-semibold",
            isMobile
              ? "pr-5 text-[7px] leading-2"
              : "pr-7 text-sm leading-5",
          )}
        >
          {note.emoji} {note.title}
        </h4>
        <NoteMarkdownPreview
          content={note.content}
          compact={isMobile}
          deferUntilVisible
          maxCharacters={NOTE_MARKDOWN_PREVIEW_MAX_CHARACTERS}
          className={cn(
            "min-h-0 w-full flex-1 overflow-hidden text-muted-foreground",
            isMobile
              ? "mt-0.5 text-[5.5px] leading-[7px]"
              : "mt-2 text-xs leading-[1.35]",
          )}
        />
      </div>

      <button
        ref={cardButtonRef}
        type="button"
        data-note-slug={note.slug}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        aria-label={`Open ${note.title}`}
        aria-haspopup={isMobile ? "dialog" : undefined}
        aria-expanded={isMobile ? isContextMenuOpen : undefined}
        className={cn(
          "absolute inset-x-0 top-0 z-10 aspect-[4/3] w-full cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A727]",
          isMobile ? "rounded-lg" : "rounded-xl",
        )}
      />

      {isPinned && (
        <button
          type="button"
          aria-label={`Unpin ${note.title}`}
          onClick={handleQuickPinClick}
          className={cn(
            "absolute z-20 flex items-center justify-center bg-muted text-muted-foreground shadow-sm transition-colors can-hover:hover:bg-muted-foreground/15 can-hover:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A727]",
            isMobile
              ? "right-1.5 top-1.5 h-6 w-6 rounded-md"
              : "right-3 top-3 h-7 w-7 rounded-lg",
          )}
        >
          <Pin
            className={cn(
              "fill-current",
              isMobile ? "h-3.5 w-3.5" : "h-4 w-4",
            )}
            aria-hidden
          />
        </button>
      )}

      <div className={cn("text-center", isMobile ? "mt-2" : "mt-2 px-1")}>
        <h4
          className={cn(
            "font-medium",
            isMobile
              ? "line-clamp-2 text-[15px] leading-[18px]"
              : "truncate text-sm",
          )}
        >
          {note.title}
        </h4>
        <p
          className={cn(
            "mt-0.5 text-muted-foreground tabular-nums",
            isMobile ? "text-[13px] leading-4" : "text-xs",
            !hasMounted && "invisible",
          )}
        >
          {hasMounted
            ? new Date(getDisplayCreatedAt(note)).toLocaleDateString("en-US")
            : "00/00/0000"}
        </p>
      </div>
    </article>
  );

  if (isMobile) {
    return (
      <>
        {cardContent}
        <MobileGalleryNoteActions
          note={note}
          isPinned={isPinned}
          canDelete={canDelete}
          open={isContextMenuOpen}
          sourceBounds={contextMenuSourceBounds}
          onOpenChange={handleMobileActionsOpenChange}
          onRestoreFocus={restoreCardFocus}
          onOpenNote={onNoteSelect}
          onPinToggle={onPinToggle}
          onDelete={onDelete}
        />
      </>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => onPinToggle(note.slug)}
          className="focus:bg-[#FFE390] focus:text-black dark:focus:bg-[#9D7D28] dark:focus:text-white"
        >
          {isPinned ? (
            <PinOff className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
          ) : (
            <Pin className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
          )}
          {isPinned ? "Unpin" : "Pin"}
        </ContextMenuItem>
        {canDelete && (
          <ContextMenuItem
            onClick={() => void onDelete(note)}
            className="text-red-600 focus:bg-[#FFE390] focus:text-black dark:focus:bg-[#9D7D28] dark:focus:text-white"
          >
            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function GalleryGrid({
  notes,
  pinnedNotes,
  onNoteSelect,
  onPinToggle,
  onDelete,
  sessionId,
  isMobile,
}: {
  notes: Note[];
  pinnedNotes: Set<string>;
  onNoteSelect: (note: Note) => void;
  onPinToggle: (slug: string) => void;
  onDelete: (note: Note) => Promise<void>;
  sessionId: string;
  isMobile: boolean;
}) {
  return (
    <div
      className={cn(
        "grid",
        isMobile
          ? "grid-cols-3 gap-x-4 gap-y-7"
          : "grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-x-5 gap-y-6",
      )}
    >
      {notes.map((note) => (
        <GalleryCard
          key={note.id}
          note={note}
          isPinned={pinnedNotes.has(note.slug)}
          onNoteSelect={onNoteSelect}
          onPinToggle={onPinToggle}
          onDelete={onDelete}
          sessionId={sessionId}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}

export function SidebarContent({
  groupedNotes,
  selectedNoteSlug,
  onNoteSelect,
  sessionId,
  handlePinToggle,
  pinnedNotes,
  localSearchResults,
  highlightedIndex,
  categoryOrder,
  labels,
  handleNoteDelete,
  openSwipeItemSlug,
  setOpenSwipeItemSlug,
  clearSearch,
  setSelectedNoteSlug,
  useCallbackNavigation = false,
  isMobile = false,
  viewMode,
}: SidebarContentProps) {
  const router = useRouter();

  const allNotes = useMemo(() => {
    return Object.values(groupedNotes).flat();
  }, [groupedNotes]);

  const handlePinToggleWithClear = useCallback(
    (slug: string) => {
      clearSearch();
      handlePinToggle(slug);
    },
    [clearSearch, handlePinToggle],
  );

  const handleGalleryPinToggle = useCallback(
    (slug: string) => {
      handlePinToggle(slug, { selectNote: false });
    },
    [handlePinToggle],
  );

  const handleEdit = useCallback(
    (slug: string) => {
      clearSearch();
      if (isMobile) {
        const note = allNotes.find((candidate) => candidate.slug === slug);
        if (note) onNoteSelect(note);
      } else {
        router.push(`/notes/${slug}`);
        setSelectedNoteSlug(slug);
      }
    },
    [allNotes, clearSearch, isMobile, onNoteSelect, router, setSelectedNoteSlug],
  );

  const handleDelete = useCallback(
    async (note: Note) => {
      clearSearch();
      await handleNoteDelete(note);
    },
    [clearSearch, handleNoteDelete],
  );

  if (viewMode === "gallery") {
    return (
      <div className={cn("pt-2", isMobile ? "pb-24" : "pb-6")}>
        {localSearchResults === null ? (
          <nav
            className={cn(isMobile ? "space-y-10" : "space-y-8")}
            aria-label="Notes gallery"
          >
            {categoryOrder.map((categoryKey) =>
              groupedNotes[categoryKey]?.length > 0 ? (
                <section key={categoryKey}>
                  <h3
                    className={cn(
                      "mb-3 font-semibold text-foreground",
                      isMobile ? "text-xl" : "text-base",
                    )}
                  >
                    {labels[categoryKey as keyof typeof labels]}
                  </h3>
                  <GalleryGrid
                    notes={groupedNotes[categoryKey]}
                    pinnedNotes={pinnedNotes}
                    onNoteSelect={onNoteSelect}
                    onPinToggle={handleGalleryPinToggle}
                    onDelete={handleDelete}
                    sessionId={sessionId}
                    isMobile={isMobile}
                  />
                </section>
              ) : null,
            )}
          </nav>
        ) : localSearchResults.length > 0 ? (
          <section>
            <h3 className="mb-3 text-base font-semibold text-foreground">
              Search Results
            </h3>
            <GalleryGrid
              notes={localSearchResults}
              pinnedNotes={pinnedNotes}
              onNoteSelect={onNoteSelect}
              onPinToggle={handleGalleryPinToggle}
              onDelete={handleDelete}
              sessionId={sessionId}
              isMobile={isMobile}
            />
          </section>
        ) : (
          <p className="mt-4 px-2 text-sm text-muted-foreground">
            No results found
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="py-2">
      {localSearchResults === null ? (
        <nav aria-label="Notes list">
          {categoryOrder.map((categoryKey) =>
            groupedNotes[categoryKey]?.length > 0 ? (
              <section key={categoryKey}>
                <h3 className="ml-2 py-1 text-xs font-bold text-muted-foreground">
                  {labels[categoryKey as keyof typeof labels]}
                </h3>
                <ul>
                  {groupedNotes[categoryKey].map(
                    (item: Note, index: number) => (
                      <NoteItem
                        key={item.id}
                        item={item}
                        selectedNoteSlug={selectedNoteSlug}
                        sessionId={sessionId}
                        onNoteSelect={onNoteSelect}
                        handlePinToggle={handlePinToggle}
                        isPinned={pinnedNotes.has(item.slug)}
                        isHighlighted={false}
                        isSearching={false}
                        handleNoteDelete={handleNoteDelete}
                        onNoteEdit={handleEdit}
                        openSwipeItemSlug={openSwipeItemSlug}
                        setOpenSwipeItemSlug={setOpenSwipeItemSlug}
                        showDivider={
                          index < groupedNotes[categoryKey].length - 1
                        }
                        useCallbackNavigation={useCallbackNavigation}
                      />
                    ),
                  )}
                </ul>
              </section>
            ) : null,
          )}
        </nav>
      ) : localSearchResults.length > 0 ? (
        <ul>
          {localSearchResults.map((item: Note, index: number) => (
            <NoteItem
              key={item.id}
              item={item}
              selectedNoteSlug={selectedNoteSlug}
              sessionId={sessionId}
              onNoteSelect={onNoteSelect}
              handlePinToggle={handlePinToggleWithClear}
              isPinned={pinnedNotes.has(item.slug)}
              isHighlighted={index === highlightedIndex}
              isSearching={true}
              handleNoteDelete={handleDelete}
              onNoteEdit={handleEdit}
              openSwipeItemSlug={openSwipeItemSlug}
              setOpenSwipeItemSlug={setOpenSwipeItemSlug}
              showDivider={index < localSearchResults.length - 1}
              useCallbackNavigation={useCallbackNavigation}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 px-2 text-sm text-muted-foreground">
          No results found
        </p>
      )}
    </div>
  );
}
