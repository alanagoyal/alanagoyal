import NewNote from "./new-note";
import { Note } from "@/lib/notes/types";

interface NavProps {
  addNewPinnedNote: (slug: string) => void;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
  isScrolled: boolean;
  isDesktop?: boolean;
  onNoteCreated?: (note: Note) => void;
}

export function Nav({
  addNewPinnedNote,
  clearSearch,
  setSelectedNoteSlug,
  isMobile,
  isScrolled,
  isDesktop = false,
  onNoteCreated,
}: NavProps) {
  return (
    <div
      className={`px-4 py-2 flex items-center justify-between ${
        isScrolled && "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]"
      }`}
    >
      {!isDesktop && (
        <div className="flex items-center gap-1.5 p-2">
          <button
            onClick={() => window.close()}
            className="cursor-pointer group w-3 h-3 rounded-full bg-red-500 hover:opacity-80 flex items-center justify-center"
            aria-label="Close tab"
          >
            <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-background -translate-y-[0.5px]">×</span>
          </button>
          <button className="group w-3 h-3 rounded-full bg-yellow-500 hover:opacity-80 flex items-center justify-center cursor-default">
            <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-background -translate-y-[0.5px]">−</span>
          </button>
          <button className="group w-3 h-3 rounded-full bg-green-500 hover:opacity-80 flex items-center justify-center cursor-default">
            <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-background -translate-y-[0.5px]">+</span>
          </button>
        </div>
      )}
      {isDesktop && <div />}
      <NewNote
        addNewPinnedNote={addNewPinnedNote}
        clearSearch={clearSearch}
        setSelectedNoteSlug={setSelectedNoteSlug}
        isMobile={isMobile}
        isDesktop={isDesktop}
        onNoteCreated={onNoteCreated}
      />
    </div>
  );
}
