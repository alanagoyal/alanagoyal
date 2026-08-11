"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  LayoutGrid,
  List,
  type LucideIcon,
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
  onGalleryBack?: () => void;
}

type Submenu = "sort" | "group" | null;

const menuItemClass =
  "flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] leading-5 transition-colors can-hover:hover:bg-[#FFE390] can-hover:hover:text-black dark:can-hover:hover:bg-[#9D7D28] dark:can-hover:hover:text-white focus-visible:bg-[#FFE390] focus-visible:text-black dark:focus-visible:bg-[#9D7D28] dark:focus-visible:text-white focus-visible:outline-none";
const MENU_CLOSE_FALLBACK_MS = 200;

function MenuCheck({ checked }: { checked: boolean }) {
  return (
    <Check
      className={cn("h-4 w-4 shrink-0", !checked && "opacity-0")}
      strokeWidth={2}
      aria-hidden
    />
  );
}

function MobileSubmenuHeader({
  icon: Icon,
  label,
  value,
  onClose,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        role="menuitem"
        aria-label={`Close ${label} menu`}
        onClick={onClose}
        className="flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left"
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] leading-4">{label}</span>
          <span className="block truncate text-[11px] leading-4 text-muted-foreground">
            {value}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
      </button>
      <div className="my-1 border-t border-muted-foreground/20" />
    </>
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
  onGalleryBack,
}: NavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<Submenu>(null);
  const pendingViewModeRef = useRef<NotesViewMode | null>(null);
  const viewModeFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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
  const sortFieldLabel = {
    default: "Default (Date Edited)",
    edited: "Date Edited",
    created: "Date Created",
    title: "Title",
  }[sortField];
  const groupModeLabel = {
    edited: "Date Edited",
    created: "Date Created",
    off: "Off",
  }[groupMode];
  const usesGroupedBackground = isMobile && !onGalleryBack;

  const applyPendingViewMode = useCallback(() => {
    const pendingViewMode = pendingViewModeRef.current;
    if (!pendingViewMode) return;

    pendingViewModeRef.current = null;
    if (viewModeFallbackRef.current) {
      clearTimeout(viewModeFallbackRef.current);
      viewModeFallbackRef.current = null;
    }
    onViewModeChange(pendingViewMode);
  }, [onViewModeChange]);

  useEffect(
    () => () => {
      if (viewModeFallbackRef.current) {
        clearTimeout(viewModeFallbackRef.current);
      }
    },
    [],
  );

  const changeViewMode = () => {
    pendingViewModeRef.current =
      viewMode === "gallery" ? "list" : "gallery";
    setOpenSubmenu(null);
    setIsOpen(false);
    viewModeFallbackRef.current = setTimeout(
      applyPendingViewMode,
      MENU_CLOSE_FALLBACK_MS,
    );
  };

  return (
    <WindowNavShell
      isMobile={isMobile}
      isScrolled={isScrolled}
      className={cn(
        usesGroupedBackground && "bg-[#F2F2F7] dark:bg-black",
      )}
      onMouseDown={nav.onDragStart}
      left={
        <div className="flex items-center gap-1">
          <WindowControls
            inShell={nav.inShell}
            className="p-2"
            onClose={nav.onClose}
            onMinimize={nav.onMinimize}
            onToggleMaximize={nav.onToggleMaximize}
            isMaximized={nav.isMaximized}
            closeLabel={nav.closeLabel}
          />
          {onGalleryBack && (
            <button
              type="button"
              aria-label="Back to notes gallery"
              onClick={onGalleryBack}
              onMouseDown={(event) => event.stopPropagation()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors can-hover:hover:bg-muted-foreground/10 can-hover:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.25} aria-hidden />
            </button>
          )}
        </div>
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
              onAnimationEnd={(event) => {
                if (
                  event.currentTarget === event.target &&
                  event.currentTarget.dataset.state === "closed"
                ) {
                  applyPendingViewMode();
                }
              }}
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
                    <List className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
                  ) : (
                    <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
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
                  onMouseEnter={() => {
                    if (!isMobile) setOpenSubmenu("sort");
                  }}
                  className={menuItemClass}
                >
                  <ArrowUpDown className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
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
                    if (!isMobile && !groupByDateDisabled) {
                      setOpenSubmenu("group");
                    }
                  }}
                  className={cn(
                    menuItemClass,
                    groupByDateDisabled &&
                      "cursor-default opacity-45 can-hover:hover:bg-transparent can-hover:hover:text-inherit dark:can-hover:hover:bg-transparent dark:can-hover:hover:text-inherit",
                  )}
                >
                  <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
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
                  {isMobile && (
                    <MobileSubmenuHeader
                      icon={ArrowUpDown}
                      label="Sort By"
                      value={sortFieldLabel}
                      onClose={() => setOpenSubmenu(null)}
                    />
                  )}
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
                    "absolute top-[74px] rounded-xl border border-black/10 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95",
                    isMobile
                      ? "right-0 w-60"
                      : viewMode === "gallery"
                      ? "right-[calc(100%-2px)] w-48"
                      : "left-[calc(100%-2px)] w-48",
                  )}
                >
                  {isMobile && (
                    <MobileSubmenuHeader
                      icon={CalendarDays}
                      label="Group By Date"
                      value={groupModeLabel}
                      onClose={() => setOpenSubmenu(null)}
                    />
                  )}
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
