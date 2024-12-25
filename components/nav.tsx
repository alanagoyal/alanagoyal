import NewNote from "./new-note";

interface NavProps {
  addNewPinnedNote: (slug: string) => void;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
}

export function Nav({
  addNewPinnedNote,
  clearSearch,
  setSelectedNoteSlug,
  isMobile,
}: NavProps) {
  return (
    <>
      {/* Padding to account for the scrollbar */}
      <div className="sm:pl-1.5 sm:pr-0 px-2 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <NewNote
          addNewPinnedNote={addNewPinnedNote}
          clearSearch={clearSearch}
          setSelectedNoteSlug={setSelectedNoteSlug}
          isMobile={isMobile}
        />
      </div>
    </>
  );
}
