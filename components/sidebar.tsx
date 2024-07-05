"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SessionId from "./session-id";
import { Pin, PinOff, Trash2, Edit } from "lucide-react";
import NewNote from "./new-note";
import SearchBar from "./search";
import { useRouter } from "next/navigation";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { createClient } from "@/utils/supabase/client";
import { useMobileDetect } from "@/components/mobile-detector";
import { useSwipeable } from "react-swipeable";
import { CommandMenu } from "./command-menu";

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
  notes,
  onNoteSelect,
}: {
  notes: any[];
  onNoteSelect: (note: any) => void;
}) {
  const [sessionId, setSessionId] = useState("");
  const [selectedNoteSlug, setSelectedNoteSlug] = useState<string | null>(null);
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const slug = pathname.split("/").pop();
    setSelectedNoteSlug(slug || null);
  }, [pathname]);

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

  const togglePinned = useCallback((slug: string) => {
    setPinnedNotes((prev) => {
      const newPinned = new Set(prev);
      if (newPinned.has(slug)) {
        newPinned.delete(slug);
      } else {
        newPinned.add(slug);
      }
      localStorage.setItem(
        "pinnedNotes",
        JSON.stringify(Array.from(newPinned))
      );
      return newPinned;
    });
  }, []);

  const addNewPinnedNote = useCallback((slug: string) => {
    setPinnedNotes((prev) => {
      const newPinned = new Set(prev).add(slug);
      localStorage.setItem(
        "pinnedNotes",
        JSON.stringify(Array.from(newPinned))
      );
      return newPinned;
    });
  }, []);

  const userSpecificNotes = notes.filter(
    (note) => note.public || note.session_id === sessionId
  );
  const groupedNotes = groupNotesByCategory(userSpecificNotes, pinnedNotes);
  sortGroupedNotes(groupedNotes);

  function groupNotesByCategory(notes: any[], pinnedNotes: Set<string>) {
    const groupedNotes: any = {
      pinned: [],
    };

    notes.forEach((note) => {
      if (pinnedNotes.has(note.slug)) {
        groupedNotes.pinned.push(note);
        return;
      }

      let category = note.category;
      if (!note.public) {
        const createdDate = new Date(note.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (createdDate.toDateString() === today.toDateString()) {
          category = "today";
        } else if (createdDate.toDateString() === yesterday.toDateString()) {
          category = "yesterday";
        } else if (createdDate > sevenDaysAgo) {
          category = "7";
        } else if (createdDate > thirtyDaysAgo) {
          category = "30";
        } else {
          category = "older";
        }
      }

      if (!groupedNotes[category]) {
        groupedNotes[category] = [];
      }
      groupedNotes[category].push(note);
    });

    return groupedNotes;
  }

  function sortGroupedNotes(groupedNotes: any) {
    Object.keys(groupedNotes).forEach((category) => {
      groupedNotes[category].sort((a: any, b: any) =>
        b.created_at.localeCompare(a.created_at)
      );
    });
  }

  const router = useRouter();

  const flattenedNotes = useCallback(() => {
    return categoryOrder.flatMap((category) =>
      groupedNotes[category] ? groupedNotes[category] : []
    );
  }, [groupedNotes]);

  const navigateNotes = useCallback(
    (direction: "up" | "down") => {
      const flattened = flattenedNotes();
      const currentIndex = flattened.findIndex(
        (note) => note.slug === selectedNoteSlug
      );
      let nextIndex;

      if (direction === "up") {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : flattened.length - 1;
      } else {
        nextIndex = currentIndex < flattened.length - 1 ? currentIndex + 1 : 0;
      }

      const nextNote = flattened[nextIndex];
      if (nextNote) {
        router.push(`/${nextNote.slug}`);
      }
    },
    [flattenedNotes, selectedNoteSlug, router]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      if (isTyping && event.key === "Escape") {
        (target as HTMLElement).blur();
      } else if (!isTyping) {
        if (event.key === "j" && !event.metaKey) {
          event.preventDefault();
          navigateNotes("down");
        } else if (event.key === "k" && !event.metaKey) {
          event.preventDefault();
          navigateNotes("up");
        } else if (event.key === "p" && !event.metaKey) {
          event.preventDefault();
          if (selectedNoteSlug) {
            togglePinned(selectedNoteSlug);
          }
        } else if (event.key === "/") {
          event.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigateNotes, selectedNoteSlug, togglePinned]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <SessionId setSessionId={setSessionId} />
      <CommandMenu
        notes={notes}
        sessionId={sessionId}
        addNewPinnedNote={addNewPinnedNote}
        navigateNotes={navigateNotes}
        togglePinned={togglePinned}
        selectedNoteSlug={selectedNoteSlug}
      />
      <div className="flex-1 overflow-y-auto">
        <SidebarContent
          groupedNotes={groupedNotes}
          selectedNoteSlug={selectedNoteSlug}
          onNoteSelect={onNoteSelect}
          notes={notes}
          sessionId={sessionId}
          togglePinned={togglePinned}
          pinnedNotes={pinnedNotes}
          addNewPinnedNote={addNewPinnedNote}
          searchInputRef={searchInputRef}
        />
      </div>
    </div>
  );
}

function SidebarContent({
  groupedNotes,
  selectedNoteSlug,
  onNoteSelect,
  notes,
  sessionId,
  togglePinned,
  pinnedNotes,
  addNewPinnedNote,
  searchInputRef,
}: {
  groupedNotes: any;
  selectedNoteSlug: string | null;
  onNoteSelect: (note: any) => void;
  notes: any[];
  sessionId: string;
  togglePinned: (slug: string) => void;
  pinnedNotes: Set<string>;
  addNewPinnedNote: (slug: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}) {
  const [localSearchResults, setLocalSearchResults] = useState<any[] | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
  const router = useRouter();

  const clearSearch = useCallback(() => {
    setLocalSearchResults(null);
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  }, [searchInputRef]);

  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    if (localSearchResults && localSearchResults.length > 0) {
      if (event.key === 'Enter') {
        event.preventDefault();
        const selectedNote = localSearchResults[highlightedIndex];
        router.push(`/${selectedNote.slug}`);
        clearSearch();
      } else if (!isSearchInputFocused) {
        if (event.key === 'j' || event.key === 'ArrowDown') {
          event.preventDefault();
          setHighlightedIndex((prevIndex) =>
            (prevIndex + 1) % localSearchResults.length
          );
        } else if (event.key === 'k' || event.key === 'ArrowUp') {
          event.preventDefault();
          setHighlightedIndex((prevIndex) =>
            (prevIndex - 1 + localSearchResults.length) % localSearchResults.length
          );
        }
      }
    }
  }, [localSearchResults, highlightedIndex, router, isSearchInputFocused, clearSearch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (searchInputRef.current && document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur();
          setIsSearchInputFocused(false);
        }
      } else {
        handleKeyNavigation(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyNavigation, searchInputRef]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [localSearchResults]);

  return (
    <div className="pt-4 px-2">
      <SearchBar
        notes={notes}
        onSearchResults={setLocalSearchResults}
        sessionId={sessionId}
        inputRef={searchInputRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onFocus={() => setIsSearchInputFocused(true)}
        onBlur={() => setIsSearchInputFocused(false)}
      />
      <div className="flex py-2 mx-2 items-center justify-between">
        <h2 className="text-lg font-bold">Notes</h2>
        <NewNote addNewPinnedNote={addNewPinnedNote} />
      </div>
      {localSearchResults === null ? (
        <nav>
          {categoryOrder.map((categoryKey) =>
            groupedNotes[categoryKey] &&
            groupedNotes[categoryKey].length > 0 ? (
              <section key={categoryKey}>
                <h3 className="py-1 text-xs font-bold text-gray-400 ml-2">
                  {labels[categoryKey as keyof typeof labels]}
                </h3>
                <ul className="space-y-2">
                  {groupedNotes[categoryKey].map((item: any, index: number) => (
                    <NoteItem
                      key={index}
                      item={item}
                      selectedNoteSlug={selectedNoteSlug}
                      sessionId={sessionId}
                      onNoteSelect={onNoteSelect}
                      groupedNotes={groupedNotes}
                      categoryOrder={categoryOrder}
                      isSwipeOpen={false}
                      setOpenSwipeItemId={() => {}}
                      togglePinned={togglePinned}
                      isPinned={pinnedNotes.has(item.slug)}
                      isHighlighted={false}
                      isSearching={false}
                    />
                  ))}
                </ul>
              </section>
            ) : null
          )}
        </nav>
      ) : localSearchResults.length > 0 ? (
        <ul className="space-y-2">
          {localSearchResults.map((item, index) => (
            <NoteItem
              key={item.id}
              item={item}
              selectedNoteSlug={selectedNoteSlug}
              sessionId={sessionId}
              onNoteSelect={onNoteSelect}
              groupedNotes={groupedNotes}
              categoryOrder={categoryOrder}
              isSwipeOpen={false}
              setOpenSwipeItemId={() => {}}
              togglePinned={togglePinned}
              isPinned={pinnedNotes.has(item.slug)}
              isHighlighted={index === highlightedIndex}
              isSearching={true}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 px-2 mt-4">No results found</p>
      )}
    </div>
  );
}

function NoteItem({
  item,
  selectedNoteSlug,
  sessionId,
  onNoteSelect,
  groupedNotes,
  categoryOrder,
  isSwipeOpen,
  setOpenSwipeItemId,
  togglePinned,
  isPinned,
  isHighlighted,
  isSearching,
}: {
  item: any;
  selectedNoteSlug: string | null;
  sessionId: string;
  onNoteSelect: (note: any) => void;
  groupedNotes: any;
  categoryOrder: string[];
  isSwipeOpen: boolean;
  setOpenSwipeItemId: (id: string | null) => void;
  togglePinned: (slug: string) => void;
  isPinned: boolean;
  isHighlighted: boolean;
  isSearching: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const isMobile = useMobileDetect();

  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (isSwiping) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventDefault);
    };
  }, [isSwiping]);

  const handleDelete = async () => {
    try {
      let nextRoute = "/";
      if (!isMobile) {
        const flattenedNotes = categoryOrder.flatMap((category) =>
          groupedNotes[category] ? groupedNotes[category] : []
        );
        const currentIndex = flattenedNotes.findIndex(
          (note) => note.slug === item.slug
        );
        const nextNote =
          flattenedNotes[currentIndex - 1] || flattenedNotes[currentIndex + 1];
        nextRoute = nextNote ? `/${nextNote.slug}` : "/about-me";
      }

      router.push(nextRoute);

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("slug", item.slug)
        .eq("session_id", sessionId);

      if (error) {
        throw error;
      }

      setOpenSwipeItemId(null);
      router.refresh();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleEdit = () => {
    setOpenSwipeItemId(null);
    router.push(`/${item.slug}`);
  };

  const handlePinToggle = () => {
    togglePinned(item.slug);
    setOpenSwipeItemId(null);
  };

  const canEditOrDelete = item.session_id === sessionId;

  const handleNoteClick = () => {
    if (onNoteSelect) {
      onNoteSelect(item);
    }
  };

  const handleSwipeAction = (action: () => void) => {
    if (isSwipeOpen) {
      action();
    }
  };

  const NoteContent = (
    <li
      className={`min-h-[50px] ${
        (!isMobile && isSearching && isHighlighted) || (!isSearching && item.slug === selectedNoteSlug)
          ? "bg-[#9D7D28] rounded-md"
          : ""
      }`}
      onClick={handleNoteClick}
    >
      <Link href={`/${item.slug || ""}`} prefetch={true} className="block py-2">
        <h2 className="text-sm font-bold pl-4 pr-4 break-words">
          {item.emoji} {item.title}
        </h2>
        <p
          className={`text-xs pl-4 pr-4 overflow-hidden text-ellipsis whitespace-nowrap ${
            (!isMobile && isSearching && isHighlighted) || (!isSearching && item.slug === selectedNoteSlug)
              ? "text-gray-300"
              : "text-gray-400"
          }`}
        >
          <span className="text-white">
            {new Date(item.created_at).toLocaleDateString("en-US")}
          </span>{" "}
          {item.content.trim().replace(/[#_*~`>+\[\]!()-]/g, " ")}
        </p>
      </Link>
    </li>
  );

  const handlers = useSwipeable({
    onSwipeStart: () => setIsSwiping(true),
    onSwiped: () => setIsSwiping(false),
    onSwipedLeft: () => {
      setOpenSwipeItemId(item.id);
      setIsSwiping(false);
    },
    onSwipedRight: () => {
      setOpenSwipeItemId(null);
      setIsSwiping(false);
    },
    trackMouse: true,
  });

  if (isMobile) {
    return (
      <div {...handlers} className="relative overflow-hidden">
        <div
          className={`transition-transform duration-300 ease-out ${
            isSwipeOpen ? "transform -translate-x-24" : ""
          }`}
        >
          {NoteContent}
        </div>
        <SwipeActions
          isOpen={isSwipeOpen}
          onPin={() => handleSwipeAction(handlePinToggle)}
          onEdit={() => handleSwipeAction(handleEdit)}
          onDelete={() => handleSwipeAction(handleDelete)}
          isPinned={isPinned}
          canEditOrDelete={canEditOrDelete}
        />
      </div>
    );
  } else {
    return (
      <ContextMenu>
        <ContextMenuTrigger>{NoteContent}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handlePinToggle} className="cursor-pointer">
            {isPinned ? "Unpin" : "Pin"}
          </ContextMenuItem>
          {item.session_id === sessionId && (
            <>
              <ContextMenuItem onClick={handleEdit} className="cursor-pointer">
                Edit
              </ContextMenuItem>
              <ContextMenuItem
                onClick={handleDelete}
                className="cursor-pointer"
              >
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  }
}

function SwipeActions({
  isOpen,
  onPin,
  onEdit,
  onDelete,
  isPinned,
  canEditOrDelete,
}: {
  isOpen: boolean;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isPinned: boolean;
  canEditOrDelete: boolean;
}) {
  return (
    <div
      className={`absolute top-0 right-0 h-full flex items-center transition-opacity duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <button
        onClick={onPin}
        className="bg-[#3293FC] text-white p-2 h-full w-16 flex items-center justify-center"
      >
        {isPinned ? <PinOff size={20} /> : <Pin size={20} />}
      </button>
      {canEditOrDelete && (
        <>
          <button
            onClick={onEdit}
            className="bg-[#787BFF] text-white p-2 h-full w-16 flex items-center justify-center"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={onDelete}
            className="bg-[#FF4539] text-white p-2 h-full w-16 flex items-center justify-center"
          >
            <Trash2 size={20} />
          </button>
        </>
      )}
    </div>
  );
}
