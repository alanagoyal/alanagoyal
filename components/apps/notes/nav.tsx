import NewNote from "./new-note";
import { Note } from "@/lib/notes/types";
import { useWindowFocus } from "@/lib/window-focus-context";
import { WindowControls } from "@/components/window-controls";
import { cn } from "@/lib/utils";

interface NavProps {
  addNewPinnedNote: (slug: string) => void;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
  isScrolled: boolean;
  useCallbackNavigation?: boolean;
  onNoteCreated?: (note: Note) => void;
}

export function Nav({
  addNewPinnedNote,
  clearSearch,
  setSelectedNoteSlug,
  isMobile,
  isScrolled,
  useCallbackNavigation = false,
  onNoteCreated,
}: NavProps) {
  const windowFocus = useWindowFocus();

  // When in desktop shell, use window controls from context
  const inShell = !!(useCallbackNavigation && windowFocus);

  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center justify-between sticky top-0 z-[1] select-none",
        isScrolled && "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]",
        isMobile ? "bg-background" : "bg-muted",
      )}
      onMouseDown={inShell ? windowFocus?.onDragStart : undefined}
    >
      <WindowControls
        inShell={inShell}
        className="p-2"
        onClose={inShell ? windowFocus?.closeWindow : !isMobile ? () => window.close() : undefined}
        onMinimize={inShell ? windowFocus?.minimizeWindow : undefined}
        onToggleMaximize={inShell ? windowFocus?.toggleMaximize : undefined}
        isMaximized={windowFocus?.isMaximized ?? false}
        closeLabel={inShell ? "Close window" : "Close tab"}
      />
      <div>
        <NewNote
          addNewPinnedNote={addNewPinnedNote}
          clearSearch={clearSearch}
          setSelectedNoteSlug={setSelectedNoteSlug}
          isMobile={isMobile}
          useCallbackNavigation={useCallbackNavigation}
          onNoteCreated={onNoteCreated}
        />
      </div>
    </div>
  );
}
