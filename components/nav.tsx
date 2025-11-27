import NewNote from "./new-note";

interface NavProps {
  addNewPinnedNote: (slug: string) => void;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
  isScrolled: boolean;
}

export function Nav({
  addNewPinnedNote,
  clearSearch,
  setSelectedNoteSlug,
  isMobile,
  isScrolled,
}: NavProps) {
  return (
    <div
      className={`px-4 py-2 flex items-center justify-between ${
        isScrolled && "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]"
      }`}
    >
      <div className="flex items-center gap-1.5 p-2">
        <button
          onClick={() => window.close()}
          className="cursor-pointer group relative"
          aria-label="Close tab"
        >
          <div className="w-3 h-3 rounded-full bg-red-500 group-hover:opacity-80" />
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none text-xs leading-none">
            <span className="text-background -translate-y-[2px]">×</span>
          </span>
        </button>
        <button className="group relative cursor-default">
          <div className="w-3 h-3 rounded-full bg-yellow-500 group-hover:opacity-80" />
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none text-xs leading-none">
            <span className="text-background -translate-y-[2px]">−</span>
          </span>
        </button>
        <button className="group relative cursor-default">
          <div className="w-3 h-3 rounded-full bg-green-500 group-hover:opacity-80" />
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none text-xs leading-none">
            <span className="text-background -translate-y-[2px]">+</span>
          </span>
        </button>
      </div>
      <NewNote
        addNewPinnedNote={addNewPinnedNote}
        clearSearch={clearSearch}
        setSelectedNoteSlug={setSelectedNoteSlug}
        isMobile={isMobile}
      />
    </div>
  );
}
