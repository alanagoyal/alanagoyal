import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Note } from '@/lib/types';

interface KeyboardShortcutsProps {
  notes: Note[];
  selectedNoteSlug: string | null;
  localSearchResults: Note[] | null;
  highlightedIndex: number;
  handlePinToggle: (slug: string) => void;
  handleNoteDelete: (note: Note) => Promise<void>;
  navigateNotes: (direction: 'up' | 'down') => void;
  clearSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  isSearchInputFocused: boolean;
  setIsSearchInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}

export function KeyboardShortcuts({
  notes,
  selectedNoteSlug,
  localSearchResults,
  highlightedIndex,
  handlePinToggle,
  handleNoteDelete,
  navigateNotes,
  clearSearch,
  searchInputRef,
  isSearchInputFocused,
  setIsSearchInputFocused,
  children
}: KeyboardShortcutsProps) {
  const router = useRouter();

  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

    if (isTyping && event.key === 'Escape') {
      (target as HTMLElement).blur();
      setIsSearchInputFocused(false);
    } else if (!isSearchInputFocused) {
      const keyActions: Record<string, () => void> = {
        'j': () => navigateNotes('down'),
        'k': () => navigateNotes('up'),
        'p': () => {
          if (localSearchResults) {
            const selectedNote = localSearchResults[highlightedIndex];
            handlePinToggle(selectedNote.slug);
          } else if (selectedNoteSlug) {
            handlePinToggle(selectedNoteSlug);
          }
        },
        'd': () => {
          if (localSearchResults) {
            const selectedNote = localSearchResults[highlightedIndex];
            handleNoteDelete(selectedNote);
          } else {
            const selectedNote = notes.find(note => note.slug === selectedNoteSlug);
            if (selectedNote) handleNoteDelete(selectedNote);
          }
        },
        '/': () => searchInputRef.current?.focus(),
        'Enter': () => {
          if (localSearchResults) {
            const selectedNote = localSearchResults[highlightedIndex];
            router.push(`/${selectedNote.slug}`);
            clearSearch();
            searchInputRef.current?.blur();
          }
        }
      };

      if (keyActions[event.key] && !event.metaKey) {
        event.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        keyActions[event.key]();
      }
    }
  }, [
    navigateNotes,
    localSearchResults,
    highlightedIndex,
    handlePinToggle,
    handleNoteDelete,
    selectedNoteSlug,
    searchInputRef,
    router,
    clearSearch,
    setIsSearchInputFocused,
    isSearchInputFocused,
    notes
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardNavigation);
    return () => window.removeEventListener('keydown', handleKeyboardNavigation);
  }, [handleKeyboardNavigation]);

  return <>{children}</>;
}