import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { NoteItem } from "./note-item";
import { Note } from "@/lib/types";

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
}: SidebarContentProps) {
  const router = useRouter();

  const handlePinToggleWithClear = useCallback(
    (slug: string) => {
      clearSearch();
      handlePinToggle(slug);
    },
    [clearSearch, handlePinToggle]
  );

  const handleEdit = useCallback(
    (slug: string) => {
      clearSearch();
      router.push(`/notes/${slug}`);
      setSelectedNoteSlug(slug);
    },
    [clearSearch, router, setSelectedNoteSlug]
  );

  const handleDelete = useCallback(
    async (note: Note) => {
      clearSearch();
      await handleNoteDelete(note);
    },
    [clearSearch, handleNoteDelete]
  );

  return (
    <div className="py-2">
      {localSearchResults === null ? (
        <nav>
          {categoryOrder.map((categoryKey) =>
            groupedNotes[categoryKey] &&
            groupedNotes[categoryKey].length > 0 ? (
              <section key={categoryKey}>
                <h3 className="py-1 text-xs font-bold text-muted-foreground ml-2">
                  {labels[categoryKey as keyof typeof labels]}
                </h3>
                <ul>
                  {groupedNotes[categoryKey].map(
                    (item: Note, index: number) => (
                      <NoteItem
                        key={index}
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
                        showDivider={index < groupedNotes[categoryKey].length - 1}
                      />
                    )
                  )}
                </ul>
              </section>
            ) : null
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
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground px-2 mt-4">No results found</p>
      )}
    </div>
  );
}
