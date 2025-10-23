# Performance Improvement Proposals

## Quick Reference

| Priority | Improvement | Expected Impact | Effort | Breaking Changes |
|----------|-------------|-----------------|---------|------------------|
| P0 (Critical) | Fix server client usage | High | Low | No |
| P0 (Critical) | Eliminate duplicate note fetches | High | Low | No |
| P1 (High) | Add layout caching | High | Low | No |
| P1 (High) | Optimize save flow | High | Medium | No |
| P1 (High) | Consolidate RPC functions | Medium | Medium | No |
| P2 (Medium) | Split Sidebar component | Medium | High | No |
| P2 (Medium) | Add lazy loading | Medium | Medium | No |
| P2 (Medium) | Implement optimistic updates | Medium | Medium | No |
| P3 (Low) | Extract keyboard hooks | Low | Medium | No |
| P3 (Low) | Add debounced search | Low | Low | No |

## P0: Critical Fixes

### 1. Fix Server Client Usage in Layout

**Problem**: `app/notes/layout.tsx` uses browser client instead of server client.

**Current Code**:
```typescript
import { createClient as createBrowserClient } from "@/utils/supabase/client";

export default async function RootLayout({ children }) {
  const supabase = createBrowserClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);
  // ...
}
```

**Fix**:
```typescript
import { createClient } from "@/utils/supabase/server";

export default async function RootLayout({ children }) {
  const supabase = createClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);
  // ...
}
```

**Expected Impact**:
- Proper SSR rendering
- Correct cookie handling
- Fixes potential hydration mismatches
- Better error messages

**Implementation Steps**:
1. Update import in `app/notes/layout.tsx`
2. Test public notes still load correctly
3. Verify no hydration errors in console

**Effort**: 5 minutes
**Breaking Changes**: None
**Risk**: Low

---

### 2. Eliminate Duplicate Note Fetches

**Problem**: `app/notes/[slug]/page.tsx` fetches the same note twice.

**Current Code**:
```typescript
export async function generateMetadata({ params }) {
  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single();
  // ... return metadata
}

export default async function NotePage({ params }) {
  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single();
  // ... render note
}
```

**Fix**: Use React `cache` to deduplicate:
```typescript
import { cache } from 'react';

const getNote = cache(async (slug: string) => {
  const supabase = createClient();
  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single();
  return note;
});

export async function generateMetadata({ params }) {
  const note = await getNote(params.slug);
  if (!note) return { title: "Note not found" };

  return {
    title: `alana goyal | ${note.title || "new note"}`,
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent(note.title || "new note")}&emoji=${encodeURIComponent(note.emoji || "👋🏼")}`],
    },
  };
}

export default async function NotePage({ params }) {
  const note = await getNote(params.slug);

  if (!note) {
    return redirect("/notes/error");
  }

  return (
    <div className="w-full min-h-dvh p-3">
      <Note note={note} />
    </div>
  );
}
```

**Expected Impact**:
- 50% reduction in database queries for note pages
- Faster page loads (eliminate 1 round-trip)
- Lower database load
- Better SEO (faster metadata generation)

**Implementation Steps**:
1. Import `cache` from React
2. Create `getNote` cached function
3. Update `generateMetadata` to use cached function
4. Update `NotePage` to use cached function
5. Test that metadata still generates correctly
6. Test that notes load without errors

**Effort**: 15 minutes
**Breaking Changes**: None
**Risk**: Low

---

## P1: High Priority Optimizations

### 3. Add Layout Caching

**Problem**: Root layout fetches public notes on every request (`revalidate = 0`).

**Current Code**:
```typescript
export const revalidate = 0;

export default async function RootLayout({ children }) {
  const supabase = createClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);
  // ...
}
```

**Fix**: Add reasonable cache duration:
```typescript
export const revalidate = 300; // 5 minutes

export default async function RootLayout({ children }) {
  const supabase = createClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);
  // ...
}
```

**Alternative Fix** (if real-time is critical): Use Supabase Realtime:
```typescript
// components/public-notes-subscription.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function PublicNotesSubscription({ onUpdate }) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('public-notes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: 'public=eq.true'
        },
        (payload) => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);

  return null;
}
```

**Expected Impact**:
- **Massive** reduction in database queries
- 300 seconds (5 min) cache = 99%+ reduction in layout fetches
- Faster page transitions (no layout refetch)
- Lower Supabase costs
- Better user experience (instant navigation)

**Trade-offs**:
- Sidebar may be stale for up to 5 minutes
- For single-user site, this is acceptable
- Can invalidate on note creation/update

**Implementation Steps**:
1. Change `revalidate = 0` to `revalidate = 300`
2. Test that sidebar still shows notes
3. Create a new public note (as admin)
4. Manually call revalidatePath('/notes') after public note changes
5. OR implement Realtime subscription for instant updates

**Effort**: 10 minutes (simple cache) or 1 hour (Realtime)
**Breaking Changes**: None
**Risk**: Low (simple cache), Medium (Realtime)

---

### 4. Optimize Note Save Flow

**Problem**: After every save, app refetches session notes AND refreshes router.

**Current Code**:
```typescript
// After RPC updates
await fetch("/notes/revalidate", { slug });
refreshSessionNotes(); // Refetches ALL session notes
router.refresh(); // Re-executes ALL server components
```

**Fix**: Use optimistic updates and skip unnecessary refetches:
```typescript
const saveNote = useCallback(
  async (updates: Partial<typeof note>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Optimistic update
    const updatedNote = { ...note, ...updates };
    setNote(updatedNote);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (note.id && sessionId) {
          // Make RPC calls in parallel
          const promises = [];

          if ('title' in updates) {
            promises.push(
              supabase.rpc("update_note_title", {
                uuid_arg: note.id,
                session_arg: sessionId,
                title_arg: updatedNote.title,
              })
            );
          }
          if ('emoji' in updates) {
            promises.push(
              supabase.rpc("update_note_emoji", {
                uuid_arg: note.id,
                session_arg: sessionId,
                emoji_arg: updatedNote.emoji,
              })
            );
          }
          if ('content' in updates) {
            promises.push(
              supabase.rpc("update_note_content", {
                uuid_arg: note.id,
                session_arg: sessionId,
                content_arg: updatedNote.content,
              })
            );
          }

          await Promise.all(promises);

          // Only revalidate if it's a public note
          if (note.public) {
            await fetch("/notes/revalidate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
              },
              body: JSON.stringify({ slug: note.slug }),
            });
          }

          // Skip refreshSessionNotes - sidebar already has optimistic update
          // Skip router.refresh - not needed for private notes

        }
      } catch (error) {
        console.error("Save failed:", error);
        // Revert optimistic update on error
        setNote(note);
        toast({
          description: "Failed to save note",
          variant: "destructive",
        });
      }
    }, 500);
  },
  [note, supabase, sessionId]
);
```

**For Sidebar Updates**: Use React Context to update sidebar optimistically:
```typescript
// app/notes/session-notes.tsx
export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  setSessionId: () => {},
  refreshSessionNotes: async () => {},
  updateNoteLocally: (noteId, updates) => {}, // NEW
});

// In provider
const updateNoteLocally = useCallback((noteId: string, updates: Partial<Note>) => {
  setNotes(prevNotes =>
    prevNotes.map(note =>
      note.id === noteId ? { ...note, ...updates } : note
    )
  );
}, []);
```

**Expected Impact**:
- 2-4 fewer queries per save
- Faster saves (parallel RPC calls)
- Smoother editing experience
- Lower database load
- No more layout refetches during editing

**Implementation Steps**:
1. Add `updateNoteLocally` to SessionNotesContext
2. Update `saveNote` to use optimistic updates
3. Make RPC calls in parallel with `Promise.all`
4. Skip `refreshSessionNotes()` and `router.refresh()`
5. Only revalidate for public notes
6. Add error handling to revert on failure
7. Test editing multiple notes
8. Test navigation during save

**Effort**: 2 hours
**Breaking Changes**: None
**Risk**: Medium (need good error handling)

---

### 5. Consolidate RPC Functions

**Problem**: Three separate RPC calls for note updates.

**Current RPC Functions**:
- `update_note_title(uuid, session, title)`
- `update_note_emoji(uuid, session, emoji)`
- `update_note_content(uuid, session, content)`

**Fix**: Create single flexible RPC function:

**SQL Migration**:
```sql
CREATE OR REPLACE FUNCTION update_note(
  uuid_arg UUID,
  session_arg UUID,
  title_arg TEXT DEFAULT NULL,
  emoji_arg TEXT DEFAULT NULL,
  content_arg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE notes
  SET
    title = COALESCE(title_arg, title),
    emoji = COALESCE(emoji_arg, emoji),
    content = COALESCE(content_arg, content),
    updated_at = NOW()
  WHERE id = uuid_arg AND session_id = session_arg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Updated Client Code**:
```typescript
const saveNote = useCallback(
  async (updates: Partial<typeof note>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const updatedNote = { ...note, ...updates };
    setNote(updatedNote);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (note.id && sessionId) {
          // Single RPC call
          await supabase.rpc("update_note", {
            uuid_arg: note.id,
            session_arg: sessionId,
            title_arg: updates.title ?? null,
            emoji_arg: updates.emoji ?? null,
            content_arg: updates.content ?? null,
          });

          // ... revalidation logic
        }
      } catch (error) {
        console.error("Save failed:", error);
      }
    }, 500);
  },
  [note, supabase, sessionId]
);
```

**Expected Impact**:
- 1 database query instead of 1-3
- Simpler client code
- Atomic updates (all fields succeed or fail together)
- Easier to add new fields in the future
- Lower latency for multi-field updates

**Implementation Steps**:
1. Create new `update_note` RPC function in Supabase
2. Update `components/note.tsx` to use new function
3. Test title updates
4. Test emoji updates
5. Test content updates
6. Test simultaneous updates
7. Remove old RPC functions (after verifying)

**Effort**: 1 hour
**Breaking Changes**: Yes (requires database migration)
**Risk**: Low (keep old functions as fallback)

---

## P2: Medium Priority Optimizations

### 6. Split Sidebar Component

**Problem**: Sidebar component is 493 lines with 10+ state variables.

**Current Structure**:
- `components/sidebar.tsx` (493 lines)
  - Keyboard navigation
  - Search
  - Note grouping
  - Pin/unpin
  - Delete
  - Theme toggle
  - Scroll tracking

**Proposed Split**:

```
components/
├── sidebar/
│   ├── sidebar.tsx (main component, 150 lines)
│   ├── use-sidebar-state.ts (state management hook)
│   ├── use-keyboard-nav.ts (keyboard navigation hook)
│   ├── use-note-operations.ts (pin/delete operations hook)
│   └── sidebar-sections.tsx (render logic)
```

**New Architecture**:

```typescript
// components/sidebar/use-sidebar-state.ts
export function useSidebarState(publicNotes: Note[], sessionNotes: Note[], sessionId: string) {
  const [selectedNoteSlug, setSelectedNoteSlug] = useState<string | null>(null);
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  const [groupedNotes, setGroupedNotes] = useState<any>({});

  // Load pinned notes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("pinnedNotes");
    if (stored) {
      setPinnedNotes(new Set(JSON.parse(stored)));
    }
  }, []);

  // Group notes by category
  useEffect(() => {
    const notes = [...publicNotes, ...sessionNotes];
    const userNotes = notes.filter(
      (note) => note.public || note.session_id === sessionId
    );
    const grouped = groupNotesByCategory(userNotes, pinnedNotes);
    sortGroupedNotes(grouped);
    setGroupedNotes(grouped);
  }, [publicNotes, sessionNotes, sessionId, pinnedNotes]);

  return {
    selectedNoteSlug,
    setSelectedNoteSlug,
    pinnedNotes,
    setPinnedNotes,
    groupedNotes,
  };
}
```

```typescript
// components/sidebar/use-keyboard-nav.ts
export function useKeyboardNav({
  groupedNotes,
  selectedNoteSlug,
  localSearchResults,
  router,
}: KeyboardNavProps) {
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

        const nextIndex = direction === "up"
          ? (currentIndex > 0 ? currentIndex - 1 : flattened.length - 1)
          : (currentIndex < flattened.length - 1 ? currentIndex + 1 : 0);

        const nextNote = flattened[nextIndex];
        if (nextNote) {
          router.push(`/notes/${nextNote.slug}`);
        }
      }
    },
    [flattenedNotes, selectedNoteSlug, router, localSearchResults]
  );

  return { navigateNotes, flattenedNotes };
}
```

```typescript
// components/sidebar/use-note-operations.ts
export function useNoteOperations({
  sessionId,
  supabase,
  router,
  isMobile,
  refreshSessionNotes,
}: NoteOperationsProps) {
  const handlePinToggle = useCallback(
    (slug: string) => {
      let isPinning = false;
      setPinnedNotes((prev) => {
        const newPinned = new Set(prev);
        isPinning = !newPinned.has(slug);
        if (isPinning) {
          newPinned.add(slug);
        } else {
          newPinned.delete(slug);
        }
        localStorage.setItem("pinnedNotes", JSON.stringify(Array.from(newPinned)));
        return newPinned;
      });

      toast({
        description: isPinning ? "Note pinned" : "Note unpinned",
      });
    },
    [router, isMobile]
  );

  const handleNoteDelete = useCallback(
    async (noteToDelete: Note) => {
      if (noteToDelete.public) {
        toast({
          description: "Oops! You can't delete public notes",
        });
        return;
      }

      try {
        await supabase.rpc("delete_note", {
          uuid_arg: noteToDelete.id,
          session_arg: sessionId,
        });

        refreshSessionNotes();
        router.refresh();

        toast({
          description: "Note deleted",
        });
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    },
    [supabase, sessionId, refreshSessionNotes, router]
  );

  return { handlePinToggle, handleNoteDelete };
}
```

```typescript
// components/sidebar/sidebar.tsx (simplified main component)
export default function Sidebar({
  notes: publicNotes,
  onNoteSelect,
  isMobile,
}: SidebarProps) {
  const { notes: sessionNotes, sessionId, refreshSessionNotes } = useContext(SessionNotesContext);

  const {
    selectedNoteSlug,
    setSelectedNoteSlug,
    pinnedNotes,
    groupedNotes,
  } = useSidebarState(publicNotes, sessionNotes, sessionId);

  const { navigateNotes } = useKeyboardNav({
    groupedNotes,
    selectedNoteSlug,
    localSearchResults,
    router,
  });

  const { handlePinToggle, handleNoteDelete } = useNoteOperations({
    sessionId,
    supabase,
    router,
    isMobile,
    refreshSessionNotes,
  });

  const [localSearchResults, setLocalSearchResults] = useState<any[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Simplified render
  return (
    <div className={`${isMobile ? "w-full max-w-full" : "w-[320px] border-r"} h-dvh flex flex-col`}>
      <Nav
        addNewPinnedNote={handlePinToggle}
        clearSearch={clearSearch}
        setSelectedNoteSlug={setSelectedNoteSlug}
        isMobile={isMobile}
      />
      <ScrollArea className="flex-1">
        <SearchBar
          notes={notes}
          onSearchResults={setLocalSearchResults}
          sessionId={sessionId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <SidebarSections
          groupedNotes={groupedNotes}
          selectedNoteSlug={selectedNoteSlug}
          onNoteSelect={onNoteSelect}
          handlePinToggle={handlePinToggle}
          handleNoteDelete={handleNoteDelete}
          localSearchResults={localSearchResults}
        />
      </ScrollArea>
    </div>
  );
}
```

**Expected Impact**:
- Much easier to maintain and test
- Better code organization
- Reusable hooks for keyboard nav, note operations
- Easier to add new features
- Potential for React.memo optimizations
- Reduced cognitive load

**Implementation Steps**:
1. Create `components/sidebar/` directory
2. Extract `useSidebarState` hook
3. Extract `useKeyboardNav` hook
4. Extract `useNoteOperations` hook
5. Create simplified `sidebar.tsx`
6. Test all functionality still works
7. Add React.memo where appropriate

**Effort**: 4 hours
**Breaking Changes**: None (internal refactor)
**Risk**: Medium (needs thorough testing)

---

### 7. Add Lazy Loading for Heavy Components

**Problem**: Large bundle size from components loaded upfront.

**Components to Lazy Load**:

1. **Command Menu** (loaded on Cmd+K):
```typescript
// components/sidebar.tsx
import { lazy, Suspense } from "react";

const CommandMenu = lazy(() => import("./command-menu"));

export default function Sidebar({ ... }) {
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  return (
    <div>
      {/* ... other sidebar content */}
      <Suspense fallback={null}>
        {commandMenuOpen && (
          <CommandMenu
            notes={notes}
            sessionId={sessionId}
            // ... props
          />
        )}
      </Suspense>
    </div>
  );
}
```

2. **Emoji Picker** (loaded on emoji button click):
```typescript
// components/note-header.tsx
import { lazy, Suspense } from "react";

const EmojiPicker = lazy(() => import("@emoji-mart/react"));

export default function NoteHeader({ note, saveNote, canEdit }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <div>
      <button onClick={() => setShowEmojiPicker(true)}>
        {note.emoji}
      </button>
      {showEmojiPicker && (
        <Suspense fallback={<div>Loading...</div>}>
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </Suspense>
      )}
    </div>
  );
}
```

3. **Markdown Editor** (loaded when editing):
```typescript
// components/note-content.tsx
import { lazy, Suspense } from "react";

const ReactMarkdown = lazy(() => import("react-markdown"));

export default function NoteContent({ note, saveNote, canEdit }) {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      {canEdit ? (
        <textarea
          value={note.content}
          onChange={(e) => saveNote({ content: e.target.value })}
        />
      ) : (
        <ReactMarkdown>{note.content}</ReactMarkdown>
      )}
    </Suspense>
  );
}
```

**Expected Impact**:
- Smaller initial bundle (20-30% reduction)
- Faster First Contentful Paint
- Lower bandwidth usage
- Better mobile performance
- Improved Lighthouse scores

**Implementation Steps**:
1. Identify heavy components (use webpack-bundle-analyzer)
2. Wrap with `lazy()` and `Suspense`
3. Add loading states
4. Test that lazy loading works
5. Measure bundle size improvement

**Effort**: 2 hours
**Breaking Changes**: None
**Risk**: Low

---

### 8. Implement Optimistic Updates for Sidebar

**Problem**: Sidebar refetches all notes after every mutation.

**Current Flow**:
```
User pins note → Update localStorage → Refetch all session notes from DB → Re-render sidebar
```

**Optimized Flow**:
```
User pins note → Update localStorage → Update context immediately → No DB fetch
```

**Implementation**:

```typescript
// app/notes/session-notes.tsx
export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  setSessionId: () => {},
  refreshSessionNotes: async () => {},
  updateNoteLocally: (noteId, updates) => {}, // NEW
  deleteNoteLocally: (noteId) => {}, // NEW
  addNoteLocally: (note) => {}, // NEW
});

export function SessionNotesProvider({ children }) {
  const [notes, setNotes] = useState<any[]>([]);

  const updateNoteLocally = useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, ...updates } : note
      )
    );
  }, []);

  const deleteNoteLocally = useCallback((noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  }, []);

  const addNoteLocally = useCallback((note: Note) => {
    setNotes(prevNotes => [note, ...prevNotes]);
  }, []);

  return (
    <SessionNotesContext.Provider
      value={{
        sessionId,
        notes,
        setSessionId,
        refreshSessionNotes,
        updateNoteLocally,
        deleteNoteLocally,
        addNoteLocally,
      }}
    >
      {children}
    </SessionNotesContext.Provider>
  );
}
```

**Usage in Components**:
```typescript
// lib/create-note.ts
export async function createNote(...) {
  const { addNoteLocally } = useContext(SessionNotesContext);

  const note = { id: noteId, slug, title: "", ... };

  // Optimistic update
  addNoteLocally(note);

  try {
    await supabase.from("notes").insert(note);
    // Success - already in UI
  } catch (error) {
    // Revert on error
    deleteNoteLocally(note.id);
    toast({ description: "Failed to create note" });
  }
}
```

```typescript
// components/sidebar.tsx
const handleNoteDelete = useCallback(
  async (noteToDelete: Note) => {
    const { deleteNoteLocally, refreshSessionNotes } = useContext(SessionNotesContext);

    // Optimistic update
    deleteNoteLocally(noteToDelete.id);

    try {
      await supabase.rpc("delete_note", {
        uuid_arg: noteToDelete.id,
        session_arg: sessionId,
      });
      // Success - already removed from UI
    } catch (error) {
      // Revert on error
      refreshSessionNotes();
      toast({ description: "Failed to delete note" });
    }
  },
  [supabase, sessionId]
);
```

**Expected Impact**:
- Instant UI updates (no loading states)
- Fewer database queries
- Better perceived performance
- Smoother user experience

**Implementation Steps**:
1. Add `updateNoteLocally`, `deleteNoteLocally`, `addNoteLocally` to context
2. Update `createNote` to use optimistic updates
3. Update `handleNoteDelete` to use optimistic updates
4. Update `saveNote` to use optimistic updates
5. Add error handling to revert on failure
6. Test all mutation operations

**Effort**: 3 hours
**Breaking Changes**: None
**Risk**: Medium (need robust error handling)

---

## P3: Low Priority Optimizations

### 9. Extract Keyboard Shortcuts Hook

**Problem**: Keyboard event listener with 10+ dependencies re-runs frequently.

**Current Code**:
```typescript
useEffect(() => {
  const shortcuts = { j: () => ..., k: () => ..., p: () => ..., d: () => ..., ... };
  const handleKeyDown = (event: KeyboardEvent) => { ... };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [navigateNotes, highlightedNote, handlePinToggle, /* ...10+ deps */]);
```

**Fix**: Create reusable hook with stable references:

```typescript
// hooks/use-keyboard-shortcuts.ts
import { useEffect, useRef } from "react";

type ShortcutHandler = (event: KeyboardEvent) => void;

interface ShortcutConfig {
  key: string;
  handler: () => void;
  modifiers?: {
    meta?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  ignoreWhenTyping?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        const modifiersMatch =
          (!shortcut.modifiers?.meta || event.metaKey) &&
          (!shortcut.modifiers?.ctrl || event.ctrlKey) &&
          (!shortcut.modifiers?.shift || event.shiftKey) &&
          (!shortcut.modifiers?.alt || event.altKey);

        if (
          event.key === shortcut.key &&
          modifiersMatch &&
          !(isTyping && shortcut.ignoreWhenTyping !== false)
        ) {
          event.preventDefault();
          shortcut.handler();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // No dependencies - uses ref
}
```

**Usage in Sidebar**:
```typescript
// components/sidebar.tsx
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function Sidebar({ ... }) {
  // ... existing hooks

  useKeyboardShortcuts([
    { key: "j", handler: () => navigateNotes("down"), ignoreWhenTyping: true },
    { key: "k", handler: () => navigateNotes("up"), ignoreWhenTyping: true },
    { key: "ArrowDown", handler: () => navigateNotes("down"), ignoreWhenTyping: true },
    { key: "ArrowUp", handler: () => navigateNotes("up"), ignoreWhenTyping: true },
    { key: "p", handler: () => highlightedNote && handlePinToggle(highlightedNote.slug), ignoreWhenTyping: true },
    { key: "d", handler: () => highlightedNote && handleNoteDelete(highlightedNote), ignoreWhenTyping: true },
    { key: "t", handler: () => setTheme(theme === "dark" ? "light" : "dark"), ignoreWhenTyping: true },
    { key: "/", handler: () => searchInputRef.current?.focus(), ignoreWhenTyping: true },
    { key: "Escape", handler: () => (document.activeElement as HTMLElement)?.blur(), ignoreWhenTyping: false },
    { key: "k", handler: () => commandMenuRef.current?.setOpen(true), modifiers: { meta: true }, ignoreWhenTyping: false },
  ]);

  // ... rest of component
}
```

**Expected Impact**:
- Event listener only attached once (not on every render)
- No more frequent re-runs of useEffect
- Better performance
- Reusable across components
- Easier to test

**Implementation Steps**:
1. Create `hooks/use-keyboard-shortcuts.ts`
2. Implement hook with ref-based handlers
3. Update `components/sidebar.tsx` to use hook
4. Test all keyboard shortcuts still work
5. Consider using in other components (command-menu.tsx, etc.)

**Effort**: 2 hours
**Breaking Changes**: None
**Risk**: Low

---

### 10. Add Debounced Search

**Problem**: Search filtering runs on every keystroke.

**Current Code** (assumed):
```typescript
// components/search.tsx
const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const query = e.target.value;
  setSearchQuery(query);

  // Filter runs immediately
  const results = notes.filter(note =>
    note.title.toLowerCase().includes(query.toLowerCase()) ||
    note.content.toLowerCase().includes(query.toLowerCase())
  );

  onSearchResults(results);
};
```

**Fix**: Debounce search filtering:

```typescript
// components/search.tsx
import { useMemo, useCallback } from "react";
import { debounce } from "lodash";

export function SearchBar({ notes, onSearchResults, ... }) {
  const [searchQuery, setSearchQuery] = useState("");

  const performSearch = useMemo(
    () =>
      debounce((query: string) => {
        if (!query.trim()) {
          onSearchResults(null);
          return;
        }

        const results = notes.filter(note =>
          note.title.toLowerCase().includes(query.toLowerCase()) ||
          note.content.toLowerCase().includes(query.toLowerCase())
        );

        onSearchResults(results);
      }, 200), // 200ms delay
    [notes, onSearchResults]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      performSearch(query);
    },
    [performSearch]
  );

  useEffect(() => {
    return () => {
      performSearch.cancel();
    };
  }, [performSearch]);

  return (
    <input
      type="text"
      value={searchQuery}
      onChange={handleSearchChange}
      placeholder="Search notes..."
    />
  );
}
```

**Expected Impact**:
- Reduced CPU usage during typing
- Smoother typing experience
- Fewer filter operations (5-10x reduction)
- Better performance with large note collections

**Implementation Steps**:
1. Install lodash if not already: `npm install lodash`
2. Update `components/search.tsx` with debounced search
3. Test search still works correctly
4. Test with many notes (100+)
5. Adjust debounce delay if needed (200-300ms optimal)

**Effort**: 30 minutes
**Breaking Changes**: None
**Risk**: Low

---

## Additional Recommendations

### 11. Add Loading States

Currently, there are no loading indicators during:
- Note creation
- Note saving
- Note deletion
- Navigation

**Recommendation**: Add loading states using React Suspense and loading.tsx files:

```typescript
// app/notes/[slug]/loading.tsx
export default function Loading() {
  return (
    <div className="w-full min-h-dvh p-3 flex items-center justify-center">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-muted rounded mb-4"></div>
        <div className="h-4 w-full bg-muted rounded mb-2"></div>
        <div className="h-4 w-full bg-muted rounded mb-2"></div>
        <div className="h-4 w-3/4 bg-muted rounded"></div>
      </div>
    </div>
  );
}
```

### 12. Add Error Boundaries

Currently, errors in components can crash the entire app.

**Recommendation**: Add error boundaries:

```typescript
// components/error-boundary.tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground">{this.state.error?.message}</p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 13. Monitor Performance with Analytics

**Recommendation**: Add performance monitoring:

```typescript
// lib/performance.ts
export function measurePageLoad() {
  if (typeof window !== "undefined" && "performance" in window) {
    window.addEventListener("load", () => {
      const perfData = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

      console.log("Performance Metrics:", {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        load: perfData.loadEventEnd - perfData.loadEventStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        firstByte: perfData.responseStart - perfData.requestStart,
      });

      // Send to analytics
      if (window.va) {
        window.va("event", "page_load", {
          duration: perfData.loadEventEnd - perfData.fetchStart,
        });
      }
    });
  }
}
```

### 14. Use React Compiler (Experimental)

React 19 introduces an experimental compiler that auto-memoizes components.

**Recommendation**: Consider enabling React Compiler for automatic optimizations:

```javascript
// next.config.js
module.exports = {
  experimental: {
    reactCompiler: true,
  },
};
```

---

## Migration Path

### Phase 1: Critical Fixes (Week 1)
1. Fix server client usage (30 min)
2. Eliminate duplicate note fetches (1 hour)
3. Add layout caching (30 min)

**Expected Impact**: 50-70% reduction in database queries

### Phase 2: High Priority (Week 2-3)
4. Optimize note save flow (3 hours)
5. Consolidate RPC functions (2 hours)

**Expected Impact**: Smoother editing, fewer queries per save

### Phase 3: Code Quality (Week 4)
6. Split Sidebar component (4 hours)
7. Add lazy loading (2 hours)

**Expected Impact**: Better maintainability, smaller bundle

### Phase 4: Polish (Week 5)
8. Implement optimistic updates (3 hours)
9. Extract keyboard hooks (2 hours)
10. Add debounced search (30 min)

**Expected Impact**: Better perceived performance

### Phase 5: Monitoring (Week 6)
11. Add loading states
12. Add error boundaries
13. Add performance monitoring

**Expected Impact**: Better error handling, performance insights

---

## Measurement Plan

### Key Metrics to Track

**Before Optimizations**:
- Database queries per page load: ~4
- Database queries per note edit: ~2-4
- Time to First Byte (TTFB): ~X ms
- First Contentful Paint (FCP): ~X ms
- Largest Contentful Paint (LCP): ~X ms
- Bundle size: ~X KB

**After Optimizations (Expected)**:
- Database queries per page load: ~2 (50% reduction)
- Database queries per note edit: ~1 (75% reduction)
- Time to First Byte (TTFB): Improve by 30-40%
- First Contentful Paint (FCP): Improve by 20-30%
- Largest Contentful Paint (LCP): Improve by 20-30%
- Bundle size: Reduce by 20-30%

### Tools to Use
- **Lighthouse**: For page performance scores
- **Chrome DevTools**: For Network tab (query count)
- **Vercel Analytics**: For real-user metrics
- **Supabase Dashboard**: For database query analytics
- **webpack-bundle-analyzer**: For bundle size analysis

---

## Conclusion

These optimizations will significantly improve the app's performance, maintainability, and user experience. The critical fixes (P0-P1) should be prioritized as they provide the most impact with the least effort.

**Total Estimated Effort**: ~30 hours spread across 6 weeks

**Expected Outcome**:
- 50-70% reduction in database queries
- 20-30% faster page loads
- 20-30% smaller bundle size
- Much better code maintainability
- Smoother, more responsive user experience
