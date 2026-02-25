"use client";

import { RefObject } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWindowFocus } from "@/lib/window-focus-context";
import { Note as NoteType } from "@/lib/notes/types";
import Sidebar from "../sidebar";
import Note from "../note";

type WindowFocusValue = ReturnType<typeof useWindowFocus>;

interface NotesDesktopPresenterProps {
  containerRef: RefObject<HTMLDivElement>;
  handleNoteCreated: (note: NoteType) => void;
  handleNoteSelect: (note: NoteType) => Promise<void>;
  inShell: boolean;
  notes: NoteType[];
  selectedNote: NoteType | null;
  selectedSlugForSidebar: string | null;
  windowFocus: WindowFocusValue;
}

export function NotesDesktopPresenter({
  containerRef,
  handleNoteCreated,
  handleNoteSelect,
  inShell,
  notes,
  selectedNote,
  selectedSlugForSidebar,
  windowFocus,
}: NotesDesktopPresenterProps) {
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
        onNoteSelect={handleNoteSelect}
        isMobile={false}
        selectedSlug={selectedSlugForSidebar}
        useCallbackNavigation
        onNoteCreated={handleNoteCreated}
      />
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
                  const elementBelow = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
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
        <ScrollArea className="h-full" isMobile={false} bottomMargin="0px">
          {selectedNote ? (
            <div className="w-full min-h-full p-3">
              <Note key={selectedNote.id} note={selectedNote} isMobile={false} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a note</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
