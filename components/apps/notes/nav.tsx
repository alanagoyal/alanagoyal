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
        "px-4 py-2 flex items-center justify-between sticky top-0 z-[1] select-none",
        isScrolled && "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]",
        isMobile ? "bg-background" : "bg-muted",
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
              className="cursor-pointer w-3 h-3 rounded-full bg-red-500 hover:bg-red-700"
              aria-label="Close window"
            />
            <button
              onClick={windowFocus.minimizeWindow}
              className="cursor-pointer w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-700"
              aria-label="Minimize window"
            />
            <button
              onClick={windowFocus.toggleMaximize}
              className="cursor-pointer w-3 h-3 rounded-full bg-green-500 hover:bg-green-700"
              aria-label={windowFocus.isMaximized ? "Restore window" : "Maximize window"}
            />
          </>
        ) : (
          // Static buttons (mobile shell or standalone browser)
          <>
            <button
              onClick={!isMobile ? () => window.close() : undefined}
              className={cn(
                "w-3 h-3 rounded-full bg-red-500",
                !isMobile && "cursor-pointer hover:bg-red-700"
              )}
              aria-label={!isMobile ? "Close tab" : undefined}
            />
            <button className="w-3 h-3 rounded-full bg-yellow-500 cursor-default" />
            <button className="w-3 h-3 rounded-full bg-green-500 cursor-default" />
          </>
        )}
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
