"use client";

import { RefObject, useCallback, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWindowFocus } from "@/lib/window-focus-context";
import { Note as NoteType, NotesViewMode } from "@/lib/notes/types";
import Sidebar from "../sidebar";
import Note from "../note";
import { setUrl } from "@/lib/set-url";

type WindowFocusValue = ReturnType<typeof useWindowFocus>;

interface NotesDesktopPresenterProps {
  containerRef: RefObject<HTMLDivElement>;
  handleNoteCreated: (note: NoteType) => void;
  handleNoteSelect: (note: NoteType) => Promise<void>;
  initialSlug?: string;
  inShell: boolean;
  notes: NoteType[];
  selectedNote: NoteType | null;
  selectedSlugForSidebar: string | null;
  windowFocus: WindowFocusValue;
  viewMode: NotesViewMode;
  onViewModeChange: (viewMode: NotesViewMode) => void;
}

export function NotesDesktopPresenter({
  containerRef,
  handleNoteCreated,
  handleNoteSelect,
  initialSlug,
  inShell,
  notes,
  selectedNote,
  selectedSlugForSidebar,
  windowFocus,
  viewMode,
  onViewModeChange,
}: NotesDesktopPresenterProps) {
  const [isGalleryDetailOpen, setIsGalleryDetailOpen] = useState(
    () => viewMode === "gallery" && Boolean(initialSlug),
  );

  useEffect(() => {
    if (viewMode !== "gallery") {
      setIsGalleryDetailOpen(false);
    }
  }, [viewMode]);

  const handleSidebarNoteSelect = useCallback(
    async (note: NoteType) => {
      if (viewMode === "gallery") {
        setIsGalleryDetailOpen(true);
      }
      await handleNoteSelect(note);
    },
    [handleNoteSelect, viewMode],
  );

  const handleSidebarNoteCreated = useCallback(
    (note: NoteType) => {
      if (viewMode === "gallery") {
        setIsGalleryDetailOpen(true);
      }
      handleNoteCreated(note);
    },
    [handleNoteCreated, viewMode],
  );

  const handleBackToGallery = useCallback(() => {
    setIsGalleryDetailOpen(false);
    setUrl("/notes");
  }, []);

  return (
    <div
      ref={containerRef}
      data-app="notes"
      tabIndex={-1}
      onMouseDown={() => containerRef.current?.focus()}
      className="notes-app h-full flex bg-background text-foreground relative outline-none"
    >
      <Sidebar
        notes={notes}
        onNoteSelect={handleSidebarNoteSelect}
        isMobile={false}
        selectedSlug={selectedSlugForSidebar}
        useCallbackNavigation
        onNoteCreated={handleSidebarNoteCreated}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        galleryDetailNote={isGalleryDetailOpen ? selectedNote : null}
        onGalleryBack={handleBackToGallery}
      />
      {viewMode === "list" && (
        <div className="flex-grow h-full overflow-hidden relative">
          {inShell && windowFocus && (
            <div
              className="absolute top-0 left-0 right-0 h-[52px] z-10 select-none"
              onMouseDown={(e) => {
                const overlay = e.currentTarget as HTMLElement;
                const startX = e.clientX;
                const startY = e.clientY;
                let didDrag = false;

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const dx = Math.abs(moveEvent.clientX - startX);
                  const dy = Math.abs(moveEvent.clientY - startY);
                  if (!didDrag && (dx > 5 || dy > 5)) {
                    didDrag = true;
                    windowFocus.onDragStart(e);
                  }
                };

                const handleMouseUp = (upEvent: MouseEvent) => {
                  document.removeEventListener("mousemove", handleMouseMove);
                  document.removeEventListener("mouseup", handleMouseUp);

                  if (!didDrag) {
                    overlay.style.pointerEvents = "none";
                    const elementBelow = document.elementFromPoint(
                      upEvent.clientX,
                      upEvent.clientY,
                    );
                    overlay.style.pointerEvents = "";
                    if (elementBelow && elementBelow !== overlay) {
                      (elementBelow as HTMLElement).click();
                    }
                  }
                };

                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
              }}
            />
          )}
          <ScrollArea
            key={selectedNote?.id ?? "empty-note"}
            className="h-full"
            isMobile={false}
          >
            {selectedNote ? (
              <div className="w-full min-h-full p-3">
                <Note
                  key={selectedNote.id}
                  note={selectedNote}
                  isMobile={false}
                />
              </div>
            ) : (
              <div className="h-full bg-background" />
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
