import { Check, ListFilter } from "lucide-react";
import NewNote from "./new-note";
import { Note } from "@/lib/notes/types";
import { WindowControls } from "@/components/window-controls";
import { WindowNavShell } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NavProps {
  addNewPinnedNote: (slug: string) => void;
  clearSearch: () => void;
  groupNotesByDate: boolean;
  onGroupNotesByDateChange: (enabled: boolean) => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
  isScrolled: boolean;
  useCallbackNavigation?: boolean;
  onNoteCreated?: (note: Note) => void;
}

export function Nav({
  addNewPinnedNote,
  clearSearch,
  groupNotesByDate,
  onGroupNotesByDateChange,
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
        <div
          className="flex items-center gap-0.5"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Notes display options"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors can-hover:hover:bg-muted-foreground/10 can-hover:hover:text-foreground"
              >
                <ListFilter className="h-4 w-4" aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={4}
              className="w-52 rounded-lg border border-black/10 bg-white/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95"
            >
              <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
                Display
              </p>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={groupNotesByDate}
                onClick={() => onGroupNotesByDateChange(!groupNotesByDate)}
                className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1 text-left text-[13px] leading-5 transition-colors can-hover:hover:bg-[#0A7CFF] can-hover:hover:text-white"
              >
                <Check
                  className={
                    groupNotesByDate
                      ? "h-3.5 w-3.5"
                      : "h-3.5 w-3.5 opacity-0"
                  }
                  strokeWidth={2}
                  aria-hidden
                />
                <span>Group notes by date</span>
              </button>
            </PopoverContent>
          </Popover>
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
