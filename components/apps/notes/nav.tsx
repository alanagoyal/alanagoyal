import NewNote from "./new-note";
import { Note } from "@/lib/notes/types";
import { WindowControls } from "@/components/window-controls";
import { WindowNavShell } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";

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
  const nav = useWindowNavBehavior({
    isDesktop: useCallbackNavigation,
    isMobile,
    shellEnabled: useCallbackNavigation,
  });

  return (
    <WindowNavShell
      isMobile={isMobile}
      isScrolled={isScrolled}
      onMouseDown={nav.onDragStart}
      left={
        <WindowControls
          inShell={nav.inShell}
          className="p-2"
          onClose={nav.onClose}
          onMinimize={nav.onMinimize}
          onToggleMaximize={nav.onToggleMaximize}
          isMaximized={nav.isMaximized}
          closeLabel={nav.closeLabel}
        />
      }
      right={
        <div onMouseDown={(e) => e.stopPropagation()}>
          <NewNote
            addNewPinnedNote={addNewPinnedNote}
            clearSearch={clearSearch}
            setSelectedNoteSlug={setSelectedNoteSlug}
            isMobile={isMobile}
            useCallbackNavigation={useCallbackNavigation}
            onNoteCreated={onNoteCreated}
          />
        </div>
      }
    />
  );
}
