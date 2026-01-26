"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useContext,
} from "react";
import { usePathname } from "next/navigation";
import SessionId from "./session-id";
import { Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { SidebarContent } from "./sidebar-content";
import { SearchBar } from "./search";
import { groupNotesByCategory, sortGroupedNotes } from "@/lib/notes/note-utils";
import { createClient } from "@/utils/supabase/client";
import { Note } from "@/lib/notes/types";
import { toast } from "@/hooks/use-toast";
import { SessionNotesContext } from "@/app/(desktop)/notes/session-notes";
import { Nav } from "./nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWindowFocus } from "@/lib/window-focus-context";
import { cn } from "@/lib/utils";
import { useFileMenu } from "@/lib/file-menu-context";
import { createNote } from "@/lib/notes/create-note";

const labels = {
  pinned: (
    <>
      <Pin className="inline-block w-4 h-4 mr-1" /> Pinned
    </>
  ),
  today: "Today",
  yesterday: "Yesterday",
  "7": "Previous 7 Days",
  "30": "Previous 30 Days",
  older: "Older",
};

const categoryOrder = ["pinned", "today", "yesterday", "7", "30", "older"];

export default function Sidebar({
  notes: publicNotes,
  onNoteSelect,
  isMobile,
  selectedSlug: externalSelectedSlug,
  useCallbackNavigation = false,
  onNoteCreated,
  dialogContainer,
}: {
  notes: any[];
  onNoteSelect: (note: any) => void;
  isMobile: boolean;
  selectedSlug?: string | null;
  useCallbackNavigation?: boolean;
  onNoteCreated?: (note: any) => void;
  dialogContainer?: HTMLElement | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedNoteSlug, setSelectedNoteSlug] = useState<string | null>(null);
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearchResults, setLocalSearchResults] = useState<any[] | null>(
    null
  );
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [groupedNotes, setGroupedNotes] = useState<any>({});
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [openSwipeItemSlug, setOpenSwipeItemSlug] = useState<string | null>(
    null
  );
  const [highlightedNote, setHighlightedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const windowFocus = useWindowFocus();
  const fileMenu = useFileMenu();

  const selectedNoteRef = useRef<HTMLDivElement>(null);

  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedNoteSlug && scrollViewportRef.current) {
      const selectedElement = scrollViewportRef.current.querySelector(`[data-note-slug="${selectedNoteSlug}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedNoteSlug]);

  useEffect(() => {
    if (selectedNoteRef.current) {
      selectedNoteRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedNoteSlug, highlightedIndex]);

  const {
    notes: sessionNotes,
    sessionId,
    setSessionId,
    refreshSessionNotes,
  } = useContext(SessionNotesContext);

  const notes = useMemo(
    () => [...publicNotes, ...sessionNotes],
    [publicNotes, sessionNotes]
  );

  useEffect(() => {
    // Use external selectedSlug prop if provided (for desktop environment)
    if (externalSelectedSlug !== undefined) {
      setSelectedNoteSlug(externalSelectedSlug);
    } else if (pathname) {
      const slug = pathname.split("/").pop();
      setSelectedNoteSlug(slug || null);
    }
  }, [pathname, externalSelectedSlug]);

  useEffect(() => {
    if (selectedNoteSlug) {
      const note = notes.find((note) => note.slug === selectedNoteSlug);
      setSelectedNote(note || null);
    } else {
      setSelectedNote(null);
    }
  }, [selectedNoteSlug, notes]);

  useEffect(() => {
    const storedPinnedNotes = localStorage.getItem("pinnedNotes");
    if (storedPinnedNotes) {
      setPinnedNotes(new Set(JSON.parse(storedPinnedNotes)));
    } else {
      const initialPinnedNotes = new Set(
        notes
          .filter(
            (note) =>
              note.slug === "about-me" ||
              note.slug === "quick-links" ||
              note.session_id === sessionId
          )
          .map((note) => note.slug)
      );
      setPinnedNotes(initialPinnedNotes);
      localStorage.setItem(
        "pinnedNotes",
        JSON.stringify(Array.from(initialPinnedNotes))
      );
    }
  }, [notes, sessionId]);

  useEffect(() => {
    const userSpecificNotes = notes.filter(
      (note) => note.public || note.session_id === sessionId
    );
    const grouped = groupNotesByCategory(userSpecificNotes, pinnedNotes);
    sortGroupedNotes(grouped);
    setGroupedNotes(grouped);
  }, [notes, sessionId, pinnedNotes]);

  useEffect(() => {
    if (localSearchResults && localSearchResults.length > 0) {
      setHighlightedNote(localSearchResults[highlightedIndex]);
    } else {
      setHighlightedNote(selectedNote);
    }
  }, [localSearchResults, highlightedIndex, selectedNote]);

  const clearSearch = useCallback(() => {
    setLocalSearchResults(null);
    setSearchQuery("");
    setHighlightedIndex(0);
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  }, [setLocalSearchResults, setHighlightedIndex]);

  const flattenedNotes = useCallback(() => {
    return categoryOrder.flatMap((category) =>
      groupedNotes[category] ? groupedNotes[category] : []
    );
  }, [groupedNotes]);

  const navigateNotes = useCallback(
    (direction: "up" | "down") => {
      if (!localSearchResults) {
        const flattened = flattenedNotes();
        const currentIndex = flattened.findIndex(
          (note) => note.slug === selectedNoteSlug
        );
        
        let nextIndex;
        if (direction === "up") {
          nextIndex =
            currentIndex > 0 ? currentIndex - 1 : flattened.length - 1;
        } else {
          nextIndex =
            currentIndex < flattened.length - 1 ? currentIndex + 1 : 0;
        }

        const nextNote = flattened[nextIndex];

        if (nextNote) {
          if (useCallbackNavigation) {
            onNoteSelect(nextNote);
          } else {
            router.push(`/notes/${nextNote.slug}`);
          }
          // Wait for navigation and React re-render
          setTimeout(() => {
            const selectedElement = document.querySelector(`[data-note-slug="${nextNote.slug}"]`);
            if (selectedElement) {
              selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 100);
        }
      }
    },
    [flattenedNotes, selectedNoteSlug, router, localSearchResults, useCallbackNavigation, onNoteSelect]
  );

  const handlePinToggle = useCallback(
    (slug: string, silent: boolean = false) => {
      let isPinning = false;
      setPinnedNotes((prev) => {
        const newPinned = new Set(prev);
        isPinning = !newPinned.has(slug);
        if (isPinning) {
          newPinned.add(slug);
        } else {
          newPinned.delete(slug);
        }
        localStorage.setItem(
          "pinnedNotes",
          JSON.stringify(Array.from(newPinned))
        );
        return newPinned;
      });

      clearSearch();

      if (!isMobile && !useCallbackNavigation) {
        router.push(`/notes/${slug}`);
      } else if (useCallbackNavigation && !isMobile) {
        // Only auto-select on desktop, not mobile (pin should stay on sidebar)
        const note = notes.find((n) => n.slug === slug);
        if (note) onNoteSelect(note);
      }

      if (!silent && !isMobile) {
        toast({
          description: isPinning ? "Note pinned" : "Note unpinned",
        });
      }
    },
    [router, isMobile, useCallbackNavigation, clearSearch, notes, onNoteSelect]
  );

  const handleNoteDelete = useCallback(
    async (noteToDelete: Note) => {
      if (noteToDelete.public) {
        if (!isMobile) {
          toast({
            description: "Oops! You can't delete public notes",
          });
        }
        return;
      }

      try {
        if (noteToDelete.id && sessionId) {
          await supabase.rpc("delete_note", {
            uuid_arg: noteToDelete.id,
            session_arg: sessionId,
          });
        }

        setGroupedNotes((prevGroupedNotes: Record<string, Note[]>) => {
          const newGroupedNotes = { ...prevGroupedNotes };
          for (const category in newGroupedNotes) {
            newGroupedNotes[category] = newGroupedNotes[category].filter(
              (note: Note) => note.slug !== noteToDelete.slug
            );
          }
          return newGroupedNotes;
        });

        const allNotes = flattenedNotes();
        const deletedNoteIndex = allNotes.findIndex(
          (note) => note.slug === noteToDelete.slug
        );

        let nextNote;
        if (deletedNoteIndex === 0) {
          nextNote = allNotes[1];
        } else {
          nextNote = allNotes[deletedNoteIndex - 1];
        }

        if (!isMobile && !useCallbackNavigation) {
          router.push(nextNote ? `/notes/${nextNote.slug}` : "/notes/about-me");
        } else if (useCallbackNavigation && !isMobile && nextNote) {
          // Only auto-select next note on desktop, not mobile
          onNoteSelect(nextNote);
        }

        clearSearch();
        refreshSessionNotes();
        if (!useCallbackNavigation) {
          router.refresh();
        }

        if (!isMobile) {
          toast({
            description: "Note deleted",
          });
        }
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    },
    [
      supabase,
      sessionId,
      flattenedNotes,
      isMobile,
      useCallbackNavigation,
      clearSearch,
      refreshSessionNotes,
      router,
      onNoteSelect,
    ]
  );

  const goToHighlightedNote = useCallback(() => {
    if (localSearchResults && localSearchResults[highlightedIndex]) {
      const selectedNote = localSearchResults[highlightedIndex];
      if (useCallbackNavigation) {
        onNoteSelect(selectedNote);
      } else {
        router.push(`/notes/${selectedNote.slug}`);
      }
      setTimeout(() => {
        const selectedElement = document.querySelector(`[data-note-slug="${selectedNote.slug}"]`);
        selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 0);
      clearSearch();
    }
  }, [localSearchResults, highlightedIndex, router, clearSearch, useCallbackNavigation, onNoteSelect]);

  // Register file menu actions for desktop menubar
  useEffect(() => {
    if (!fileMenu) return;

    fileMenu.registerNotesActions({
      onNewNote: () => {
        createNote(
          sessionId,
          router,
          handlePinToggle,
          refreshSessionNotes,
          setSelectedNoteSlug,
          isMobile,
          useCallbackNavigation,
          onNoteCreated
        );
      },
      onPinNote: () => {
        if (highlightedNote) {
          handlePinToggle(highlightedNote.slug);
        }
      },
      onDeleteNote: () => {
        if (highlightedNote) {
          handleNoteDelete(highlightedNote);
        }
      },
    });

    return () => {
      fileMenu.unregisterNotesActions();
    };
  }, [fileMenu, router, setSelectedNoteSlug, sessionId, handlePinToggle, refreshSessionNotes, isMobile, useCallbackNavigation, onNoteCreated, highlightedNote, handleNoteDelete]);

  // Update file menu state when highlighted note or pinned status changes
  useEffect(() => {
    if (!fileMenu) return;
    const isPinned = highlightedNote ? pinnedNotes.has(highlightedNote.slug) : false;
    fileMenu.updateNotesState({ noteIsPinned: isPinned });
  }, [fileMenu, highlightedNote, pinnedNotes]);

  useEffect(() => {
    const shortcuts = {
      j: () => navigateNotes("down"),
      ArrowDown: () => navigateNotes("down"),
      k: () => navigateNotes("up"),
      ArrowUp: () => navigateNotes("up"),
      p: () => highlightedNote && handlePinToggle(highlightedNote.slug),
      d: () => highlightedNote && handleNoteDelete(highlightedNote),
      "/": () => searchInputRef.current?.focus(),
      Escape: () => (document.activeElement as HTMLElement)?.blur(),
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Check if this app should handle the shortcut
      // In desktop mode (windowFocus exists), check if this window is focused
      // In standalone mode, check if target is within this app
      if (windowFocus) {
        if (!windowFocus.isFocused) return;
      } else {
        if (!target.closest('[data-app="notes"]')) return;
      }

      const isTyping =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable;

      if (isTyping) {
        if (event.key === "Escape") {
          shortcuts["Escape"]();
        } else if (
          event.key === "Enter" &&
          localSearchResults &&
          localSearchResults.length > 0
        ) {
          event.preventDefault();
          goToHighlightedNote();
        }
        return;
      }

      const key = event.key as keyof typeof shortcuts;
      if (shortcuts[key] && !(event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        (document.activeElement as HTMLElement)?.blur();

        if (
          localSearchResults &&
          ["j", "ArrowDown", "k", "ArrowUp"].includes(key)
        ) {
          const direction = ["j", "ArrowDown"].includes(key) ? 1 : -1;
          setHighlightedIndex(
            (prevIndex) =>
              (prevIndex + direction + localSearchResults.length) %
              localSearchResults.length
          );
        } else {
          shortcuts[key]();
        }
      } else if (
        event.key === "Enter" &&
        localSearchResults &&
        localSearchResults.length > 0
      ) {
        event.preventDefault();
        goToHighlightedNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    navigateNotes,
    highlightedNote,
    handlePinToggle,
    localSearchResults,
    setHighlightedIndex,
    handleNoteDelete,
    goToHighlightedNote,
    windowFocus,
  ]);

  const handleNoteSelect = useCallback(
    (note: any) => {
      onNoteSelect(note);
      if (!isMobile && !useCallbackNavigation) {
        router.push(`/notes/${note.slug}`);
      }
      clearSearch();
    },
    [clearSearch, onNoteSelect, isMobile, useCallbackNavigation, router]
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        isMobile
          ? "w-full max-w-full bg-background"
          : "w-[320px] border-r border-muted-foreground/20 bg-muted"
      )}
    >
      <Nav
        addNewPinnedNote={handlePinToggle}
        clearSearch={clearSearch}
        setSelectedNoteSlug={setSelectedNoteSlug}
        isMobile={isMobile}
        isScrolled={isScrolled}
        useCallbackNavigation={useCallbackNavigation}
        onNoteCreated={onNoteCreated}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea
          className="h-full"
        onScrollCapture={(e: React.UIEvent<HTMLDivElement>) => {
          const viewport = e.currentTarget.querySelector(
            '[data-radix-scroll-area-viewport]'
          );
          if (viewport) {
            const scrolled = viewport.scrollTop > 0;
            setIsScrolled(scrolled);
          }
        }}
        isMobile={isMobile}
        bottomMargin="0px"
      >
        <div ref={scrollViewportRef} className="flex flex-col w-full">
          <SessionId setSessionId={setSessionId} />
          <div className={`${isMobile ? "w-full" : "w-[320px]"} px-2`}>
            <SearchBar
              notes={notes}
              onSearchResults={setLocalSearchResults}
              sessionId={sessionId}
              inputRef={searchInputRef}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setHighlightedIndex={setHighlightedIndex}
              clearSearch={clearSearch}
            />
            <SidebarContent
              groupedNotes={groupedNotes}
              selectedNoteSlug={selectedNoteSlug}
              onNoteSelect={handleNoteSelect}
              sessionId={sessionId}
              handlePinToggle={handlePinToggle}
              pinnedNotes={pinnedNotes}
              localSearchResults={localSearchResults}
              highlightedIndex={highlightedIndex}
              categoryOrder={categoryOrder}
              labels={labels}
              handleNoteDelete={handleNoteDelete}
              openSwipeItemSlug={openSwipeItemSlug}
              setOpenSwipeItemSlug={setOpenSwipeItemSlug}
              clearSearch={clearSearch}
              setSelectedNoteSlug={setSelectedNoteSlug}
              useCallbackNavigation={useCallbackNavigation}
              isMobile={isMobile}
            />
          </div>
        </div>
      </ScrollArea>
      </div>
    </div>
  );
}
