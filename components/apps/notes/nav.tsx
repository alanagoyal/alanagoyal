import NewNote from "./new-note";
import { Note } from "@/lib/notes/types";
import { useWindowFocus } from "@/lib/window-focus-context";
import { cn } from "@/lib/utils";

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
  const windowFocus = useWindowFocus();

  // When in desktop shell, use window controls from context
  const inShell = isDesktop && windowFocus;

  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center justify-between select-none",
        isScrolled && "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]",
        inShell && !windowFocus.isMaximized && "cursor-grab active:cursor-grabbing"
      )}
      onMouseDown={inShell ? windowFocus.onDragStart : undefined}
    >
      <div className="window-controls flex items-center gap-1.5 p-2">
        {inShell ? (
          // Desktop shell - use window controls from context
          <>
            <button
              onClick={windowFocus.closeWindow}
              className="cursor-pointer group w-3 h-3 rounded-full bg-red-500 hover:opacity-80 flex items-center justify-center"
              aria-label="Close window"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-red-900 -translate-y-[0.5px]">×</span>
            </button>
            <button
              onClick={windowFocus.minimizeWindow}
              className="group w-3 h-3 rounded-full bg-yellow-500 hover:opacity-80 flex items-center justify-center cursor-pointer"
              aria-label="Minimize window"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-yellow-900 -translate-y-[0.5px]">−</span>
            </button>
            <button
              onClick={windowFocus.toggleMaximize}
              className="group w-3 h-3 rounded-full bg-green-500 hover:opacity-80 flex items-center justify-center cursor-pointer"
              aria-label={windowFocus.isMaximized ? "Restore window" : "Maximize window"}
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-medium leading-none text-green-900 -translate-y-[0.5px]">+</span>
            </button>
          </>
        ) : !isDesktop ? (
          // Standalone browser - close tab
          <>
            <button
              onClick={() => window.close()}
              className="cursor-pointer group w-3 h-3 rounded-full bg-red-500 hover:opacity-80 flex items-center justify-center"
              aria-label="Close tab"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-red-900 -translate-y-[0.5px]">×</span>
            </button>
            <button className="group w-3 h-3 rounded-full bg-yellow-500 hover:opacity-80 flex items-center justify-center cursor-default">
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-medium leading-none text-yellow-900 -translate-y-[0.5px]">−</span>
            </button>
            <button className="group w-3 h-3 rounded-full bg-green-500 hover:opacity-80 flex items-center justify-center cursor-default">
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-medium leading-none text-green-900 -translate-y-[0.5px]">+</span>
            </button>
          </>
        ) : null}
      </div>
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
