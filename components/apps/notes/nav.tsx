"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  ChevronRight,
  Ellipsis,
  LayoutGrid,
  List,
} from "lucide-react";
import NewNote from "./new-note";
import {
  Note,
  NotesGroupMode,
  NotesSortDirection,
  NotesSortField,
  NotesViewMode,
} from "@/lib/notes/types";
import { WindowControls } from "@/components/window-controls";
import { WindowNavShell } from "@/components/window-nav-shell";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NavProps {
  addNewPinnedNote: (slug: string) => void;
  clearSearch: () => void;
  groupMode: NotesGroupMode;
  onGroupModeChange: (mode: NotesGroupMode) => void;
  sortField: NotesSortField;
  onSortFieldChange: (field: NotesSortField) => void;
  sortDirection: NotesSortDirection;
  onSortDirectionChange: (direction: NotesSortDirection) => void;
  viewMode: NotesViewMode;
  onViewModeChange: (viewMode: NotesViewMode) => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  isMobile: boolean;
  isScrolled: boolean;
  useCallbackNavigation?: boolean;
  onNoteCreated?: (note: Note) => void;
}

type Submenu = "sort" | "group" | null;

const menuItemClass =
  "flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] leading-5 transition-colors can-hover:hover:bg-[#0A7CFF] can-hover:hover:text-white";

function MenuCheck({ checked }: { checked: boolean }) {
  return (
    <Check
      className={cn("h-3.5 w-3.5 shrink-0", !checked && "opacity-0")}
      strokeWidth={2.25}
      aria-hidden
    />
  );
}

export function Nav({
  addNewPinnedNote,
  clearSearch,
  groupMode,
  onGroupModeChange,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  viewMode,
  onViewModeChange,
  setSelectedNoteSlug,
  isMobile,
  isScrolled,
  useCallbackNavigation = false,
  onNoteCreated,
}: NavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<Submenu>(null);
  const nav = useWindowNavBehavior({
    isDesktop: useCallbackNavigation,
    isMobile,
    shellEnabled: useCallbackNavigation,
  });
  const groupByDateDisabled = sortField === "title";
  const dateDirectionLabels =
    sortField === "title"
      ? (["Ascending", "Descending"] as const)
      : (["Newest First", "Oldest First"] as const);

  const changeViewMode = () => {
    onViewModeChange(viewMode === "gallery" ? "list" : "gallery");
    setIsOpen(false);
  };

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
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Popover
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) setOpenSubmenu(null);
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Notes display options"
                className="flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-muted-foreground transition-colors can-hover:hover:bg-muted-foreground/10 can-hover:hover:text-foreground"
              >
                <Ellipsis className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={4}
              className="relative w-56 overflow-visible rounded-xl border border-black/10 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95"
            >
              <div role="menu" aria-label="Notes display options">
                <button
                  type="button"
                  role="menuitem"
                  onClick={changeViewMode}
                  onMouseEnter={() => setOpenSubmenu(null)}
                  className={menuItemClass}
                >
                  {viewMode === "gallery" ? (
                    <List className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  <span>
                    {viewMode === "gallery"
                      ? "View as List"
                      : "View as Gallery"}
                  </span>
                </button>

                <div className="my-1 border-t border-muted-foreground/20" />

                <button
                  type="button"
                  role="menuitem"
                  aria-haspopup="menu"
                  aria-expanded={openSubmenu === "sort"}
                  onClick={() =>
                    setOpenSubmenu(openSubmenu === "sort" ? null : "sort")
                  }
                  onMouseEnter={() => setOpenSubmenu("sort")}
                  className={menuItemClass}
                >
                  <ArrowUpDown className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1">Sort By</span>
                  <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>

                <button
                  type="button"
                  role="menuitem"
                  aria-haspopup="menu"
                  aria-expanded={openSubmenu === "group"}
                  aria-disabled={groupByDateDisabled}
                  disabled={groupByDateDisabled}
                  onClick={() =>
                    setOpenSubmenu(openSubmenu === "group" ? null : "group")
                  }
                  onMouseEnter={() => {
                    if (!groupByDateDisabled) setOpenSubmenu("group");
                  }}
                  className={cn(
                    menuItemClass,
                    groupByDateDisabled &&
                      "cursor-default opacity-45 can-hover:hover:bg-transparent can-hover:hover:text-inherit",
                  )}
                >
                  <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1">Group By Date</span>
                  <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>
              </div>

              {openSubmenu === "sort" && (
                <div
                  role="menu"
                  aria-label="Sort notes"
                  className={cn(
                    "absolute top-10 w-60 rounded-xl border border-black/10 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95",
                    isMobile
                      ? "right-0"
                      : viewMode === "gallery"
                      ? "right-[calc(100%-2px)]"
                      : "left-[calc(100%-2px)]",
                  )}
                >
                  {(
                    [
                      ["default", "Default (Date Edited)"],
                      ["edited", "Date Edited"],
                      ["created", "Date Created"],
                      ["title", "Title"],
                    ] as const
                  ).map(([field, label]) => (
                    <button
                      key={field}
                      type="button"
                      role="menuitemradio"
                      aria-checked={sortField === field}
                      onClick={() => onSortFieldChange(field)}
                      className={menuItemClass}
                    >
                      <MenuCheck checked={sortField === field} />
                      <span>{label}</span>
                    </button>
                  ))}

                  <div className="my-1 border-t border-muted-foreground/20" />

                  {(["newest", "oldest"] as const).map((direction, index) => (
                    <button
                      key={direction}
                      type="button"
                      role="menuitemradio"
                      aria-checked={sortDirection === direction}
                      onClick={() => onSortDirectionChange(direction)}
                      className={menuItemClass}
                    >
                      <MenuCheck checked={sortDirection === direction} />
                      <span>{dateDirectionLabels[index]}</span>
                    </button>
                  ))}
                </div>
              )}

              {openSubmenu === "group" && !groupByDateDisabled && (
                <div
                  role="menu"
                  aria-label="Group notes by date"
                  className={cn(
                    "absolute top-[74px] w-48 rounded-xl border border-black/10 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95",
                    isMobile
                      ? "right-0"
                      : viewMode === "gallery"
                      ? "right-[calc(100%-2px)]"
                      : "left-[calc(100%-2px)]",
                  )}
                >
                  {(
                    [
                      ["edited", "Date Edited"],
                      ["created", "Date Created"],
                      ["off", "Off"],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      role="menuitemradio"
                      aria-checked={groupMode === mode}
                      onClick={() => onGroupModeChange(mode)}
                      className={menuItemClass}
                    >
                      <MenuCheck checked={groupMode === mode} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
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
