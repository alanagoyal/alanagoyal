import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pin } from "lucide-react";
import { NoteItem } from "./note-item";
import { Note, NotesViewMode } from "@/lib/notes/types";
import { getDisplayCreatedAt } from "@/lib/notes/display-created-at";
import { getNotePreviewText } from "@/lib/notes/note-utils";
import { cn } from "@/lib/utils";

interface SidebarContentProps {
  groupedNotes: Record<string, Note[]>;
  selectedNoteSlug: string | null;
  onNoteSelect: (note: Note) => void;
  sessionId: string;
  handlePinToggle: (slug: string) => void;
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
  isMobile: boolean;
}

function GalleryCard({
  note,
  isPinned,
  onNoteSelect,
  onPinToggle,
  isMobile,
}: GalleryCardProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <article className="group relative min-w-0">
      <button
        type="button"
        data-note-slug={note.slug}
        onClick={() => onNoteSelect(note)}
        className={cn(
          "flex aspect-[4/3] w-full flex-col overflow-hidden border border-muted-foreground/25 bg-background text-left shadow-sm transition-[border-color,box-shadow,transform] can-hover:hover:-translate-y-0.5 can-hover:hover:border-muted-foreground/40 can-hover:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A727]",
          isMobile
            ? "rounded-lg px-2 py-1.5"
            : "rounded-xl px-4 py-3",
        )}
      >
        <h4
          className={cn(
            "line-clamp-2 font-semibold",
            isMobile
              ? "pr-5 text-[9px] leading-[11px]"
              : "pr-7 text-sm leading-5",
          )}
        >
          {note.emoji} {note.title}
        </h4>
        <p
          className={cn(
            "whitespace-pre-wrap text-muted-foreground",
            isMobile
              ? "mt-1 line-clamp-[6] text-[7px] leading-[1.25]"
              : "mt-2 line-clamp-[7] text-xs leading-[1.35]",
          )}
        >
          {getNotePreviewText(note.content)}
        </p>
      </button>

      {isPinned && (
        <button
          type="button"
          aria-label={`Unpin ${note.title}`}
          onClick={() => onPinToggle(note.slug)}
          className={cn(
            "absolute flex items-center justify-center bg-muted text-muted-foreground shadow-sm transition-colors can-hover:hover:bg-muted-foreground/15 can-hover:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A727]",
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
}

function GalleryGrid({
  notes,
  pinnedNotes,
  onNoteSelect,
  onPinToggle,
  isMobile,
}: {
  notes: Note[];
  pinnedNotes: Set<string>;
  onNoteSelect: (note: Note) => void;
  onPinToggle: (slug: string) => void;
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
                    onPinToggle={handlePinToggle}
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
              onPinToggle={handlePinToggleWithClear}
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
