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
}

function GalleryCard({
  note,
  isPinned,
  onNoteSelect,
  onPinToggle,
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
        className="flex aspect-[4/3] w-full flex-col overflow-hidden rounded-xl border border-muted-foreground/25 bg-background px-4 py-3 text-left shadow-sm transition-[border-color,box-shadow,transform] can-hover:hover:-translate-y-0.5 can-hover:hover:border-muted-foreground/40 can-hover:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A727]"
      >
        <h4 className="line-clamp-2 pr-7 text-sm font-semibold leading-5">
          {note.emoji} {note.title}
        </h4>
        <p className="mt-2 line-clamp-[7] whitespace-pre-wrap text-xs leading-[1.35] text-muted-foreground">
          {getNotePreviewText(note.content)}
        </p>
      </button>

      {isPinned && (
        <button
          type="button"
          aria-label={`Unpin ${note.title}`}
          onClick={() => onPinToggle(note.slug)}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground shadow-sm transition-colors can-hover:hover:bg-muted-foreground/15 can-hover:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A727]"
        >
          <Pin className="h-4 w-4 fill-current" aria-hidden />
        </button>
      )}

      <div className="mt-2 px-1 text-center">
        <h4 className="truncate text-sm font-medium">{note.title}</h4>
        <p
          className={cn(
            "mt-0.5 text-xs text-muted-foreground tabular-nums",
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
}: {
  notes: Note[];
  pinnedNotes: Set<string>;
  onNoteSelect: (note: Note) => void;
  onPinToggle: (slug: string) => void;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-x-5 gap-y-6">
      {notes.map((note) => (
        <GalleryCard
          key={note.id}
          note={note}
          isPinned={pinnedNotes.has(note.slug)}
          onNoteSelect={onNoteSelect}
          onPinToggle={onPinToggle}
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
      <div className="pb-6 pt-2">
        {localSearchResults === null ? (
          <nav className="space-y-8" aria-label="Notes gallery">
            {categoryOrder.map((categoryKey) =>
              groupedNotes[categoryKey]?.length > 0 ? (
                <section key={categoryKey}>
                  <h3 className="mb-3 text-base font-semibold text-foreground">
                    {labels[categoryKey as keyof typeof labels]}
                  </h3>
                  <GalleryGrid
                    notes={groupedNotes[categoryKey]}
                    pinnedNotes={pinnedNotes}
                    onNoteSelect={onNoteSelect}
                    onPinToggle={handlePinToggle}
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
