"use client";

import { RefObject } from "react";
import { Note as NoteType } from "@/lib/notes/types";
import Sidebar from "../sidebar";
import Note from "../note";
import { Icons } from "../icons";

interface NotesMobilePresenterProps {
  containerRef: RefObject<HTMLDivElement>;
  handleBackToSidebar: () => void;
  handleNoteCreated: (note: NoteType) => void;
  handleNoteSelect: (note: NoteType) => Promise<void>;
  loading: boolean;
  notes: NoteType[];
  selectedNote: NoteType | null;
  selectedSlugForSidebar: string | null;
  showSidebar: boolean;
}

export function NotesMobilePresenter({
  containerRef,
  handleBackToSidebar,
  handleNoteCreated,
  handleNoteSelect,
  loading,
  notes,
  selectedNote,
  selectedSlugForSidebar,
  showSidebar,
}: NotesMobilePresenterProps) {
  return (
    <div
      ref={containerRef}
      data-app="notes"
      tabIndex={-1}
      onMouseDown={() => containerRef.current?.focus()}
      className="notes-app h-full bg-background text-foreground outline-none"
    >
      {showSidebar ? (
        loading ? (
          <div className="h-full bg-background" />
        ) : (
          <Sidebar
            notes={notes}
            onNoteSelect={handleNoteSelect}
            isMobile={true}
            selectedSlug={selectedSlugForSidebar}
            useCallbackNavigation
            onNoteCreated={handleNoteCreated}
          />
        )
      ) : (
        <div className="h-full">
          {selectedNote && (
            <div className="h-full p-3">
              <Note key={selectedNote.id} note={selectedNote} isMobile={true} onBack={handleBackToSidebar} />
            </div>
          )}
          {!selectedNote && (
            <div className="h-full p-3">
              <button onClick={handleBackToSidebar} className="pt-2 flex items-center">
                <Icons.back />
                <span className="text-[#e2a727] text-base ml-1">Notes</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
