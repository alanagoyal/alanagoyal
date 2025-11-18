---
name: optimize-note-save-performance
description: This skill explains the current note save mechanism and provides optimization strategies for the debounced auto-save pattern used in this application.
---

## When to Use This Skill

- Understanding how note saves work
- Debugging save performance issues
- Preventing data loss from lost saves
- Optimizing excessive database writes
- Improving perceived save performance

## Current Implementation

### Save Mechanism Overview

**Location**: `/workspace/repo/components/note.tsx`

**Pattern**: Debounced auto-save with optimistic updates

```typescript
const saveNote = useCallback(
  (updates: Partial<Note>) => {
    // 1. Optimistic update (immediate UI change)
    setNote((prevNote: typeof note) => {
      const updatedNote = { ...prevNote, ...updates };
      noteRef.current = updatedNote;
      return updatedNote;
    });

    // 2. Accumulate updates in ref
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // 3. Debounce the actual save (500ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const pendingUpdates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = {};

      // 4. Parallel RPC calls for each changed field
      if ("title" in pendingUpdates) {
        await supabase.rpc("update_note_title", { ... });
      }
      if ("emoji" in pendingUpdates) {
        await supabase.rpc("update_note_emoji", { ... });
      }
      if ("content" in pendingUpdates) {
        await supabase.rpc("update_note_content", { ... });
      }

      // 5. Revalidate ISR cache
      await fetch("/notes/revalidate", { slug });

      // 6. Refresh session notes
      refreshSessionNotes();

      // 7. Refresh router
      router.refresh();
    }, 500);
  },
  [note, sessionId, refreshSessionNotes, router]
);
```

### How It Works

**Step 1: User Types**
```
User types "Hello" in editor
  ↓
NoteContent onChange fires
  ↓
saveNote({ content: "Hello" }) called
```

**Step 2: Optimistic Update**
```
Local state updates immediately
  ↓
User sees "Hello" in editor (instant feedback)
  ↓
No loading spinner, no delay
```

**Step 3: Debounce**
```
Timer starts: 500ms countdown
  ↓
User types "Hello World"
  ↓
Timer resets: 500ms countdown
  ↓
User stops typing
  ↓
After 500ms idle: Database save executes
```

**Step 4: Database Write**
```
Parallel RPC calls:
  - update_note_title (if title changed)
  - update_note_emoji (if emoji changed)
  - update_note_content (if content changed)
```

**Step 5: Cache & State Refresh**
```
Revalidate ISR cache (if public note)
  ↓
Refresh session notes context
  ↓
Refresh router (re-fetch server components)
```

## Performance Issues

### Issue 1: Excessive Refetching After Save

**Problem**: Every save triggers 3+ database queries

```typescript
// After database write
await fetch("/notes/revalidate", { slug }); // HTTP request
refreshSessionNotes(); // Refetch ALL session notes
router.refresh(); // Refetch ALL server components
```

**Impact**:
- Layout refetch: All public notes (even if editing private note)
- Session notes refetch: All session notes (not just the updated one)
- Page refetch: Specific note (might already be cached)

**Better Approach**: Skip refetches for private notes
```typescript
// Only revalidate if public note
if (note.public) {
  await fetch("/notes/revalidate", { slug });
  router.refresh();
}

// Optimistic update in sidebar (no refetch)
// Only refresh session notes if sidebar is stale
```

### Issue 2: Multiple RPC Calls for Single Save

**Problem**: Separate RPC calls for title, emoji, content

```typescript
// If user changed title AND content
await supabase.rpc("update_note_title", { ... });  // RPC call 1
await supabase.rpc("update_note_content", { ... }); // RPC call 2
```

**Impact**:
- 2-3 database writes per save
- Higher latency (sequential execution)
- More complex error handling

**Better Approach**: Use single `update_note` RPC (already exists but unused)
```typescript
// Single RPC call with optional fields
await supabase.rpc("update_note", {
  uuid_arg: note.id,
  session_arg: sessionId,
  title_arg: pendingUpdates.title,
  emoji_arg: pendingUpdates.emoji,
  content_arg: pendingUpdates.content,
});
```

**Update RPC function to handle NULL values**:
```sql
CREATE OR REPLACE FUNCTION public.update_note(
  uuid_arg uuid,
  session_arg uuid,
  title_arg text DEFAULT NULL,
  emoji_arg text DEFAULT NULL,
  content_arg text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET
      title = COALESCE(title_arg, title),
      emoji = COALESCE(emoji_arg, emoji),
      content = COALESCE(content_arg, content)
    WHERE id = uuid_arg AND session_id = session_arg;
END;
$function$;
```

### Issue 3: Potential Data Loss from Debouncing

**Problem**: If user navigates away within 500ms, changes are lost

**Scenarios**:
1. User types, waits 450ms, closes tab → **Lost**
2. User types, clicks link before 500ms → **Lost**
3. User types, browser crashes → **Lost**
4. User types, network fails during save → **Lost silently**

**Current State**: No safeguards against data loss

### Issue 4: No Save Status Indicator

**Problem**: User doesn't know if save is pending or failed

**User Experience Issues**:
- No "Saving..." indicator during debounce
- No "Saved" confirmation after success
- No error message if save fails
- No retry mechanism for failed saves

## Optimization Strategies

### Strategy 1: Skip Unnecessary Refetches

**Before**:
```typescript
// Always refetch everything
await fetch("/notes/revalidate", { slug });
refreshSessionNotes();
router.refresh();
```

**After**:
```typescript
// Only revalidate public notes
if (note.public) {
  await fetch("/notes/revalidate", { slug });
  router.refresh();
} else {
  // For private notes, just update sidebar optimistically
  // No need to refetch from database
}

// Skip refreshSessionNotes if sidebar shows optimistic update
// Only refresh on navigation or manual refresh
```

**Impact**: Reduces queries from 3+ to 1 per save

### Strategy 2: Batch RPC Calls

**Before**:
```typescript
if ("title" in pendingUpdates) {
  await supabase.rpc("update_note_title", { ... });
}
if ("emoji" in pendingUpdates) {
  await supabase.rpc("update_note_emoji", { ... });
}
if ("content" in pendingUpdates) {
  await supabase.rpc("update_note_content", { ... });
}
```

**After**:
```typescript
// Single RPC call with optional fields
await supabase.rpc("update_note", {
  uuid_arg: note.id,
  session_arg: sessionId,
  title_arg: pendingUpdates.title || null,
  emoji_arg: pendingUpdates.emoji || null,
  content_arg: pendingUpdates.content || null,
});
```

**Impact**: Reduces RPC calls from 1-3 to always 1

### Strategy 3: Add Save Status Indicator

**Implementation**:
```typescript
const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

const saveNote = useCallback((updates: Partial<Note>) => {
  // Optimistic update
  setNote((prev) => ({ ...prev, ...updates }));

  // Mark as saving
  setSaveStatus('saving');

  // Debounced save
  clearTimeout(saveTimeoutRef.current);
  saveTimeoutRef.current = setTimeout(async () => {
    try {
      await supabase.rpc("update_note", { ... });
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      console.error("Save failed:", error);
    }
  }, 500);
}, []);

// Render status indicator
return (
  <div>
    {saveStatus === 'saving' && <span>Saving...</span>}
    {saveStatus === 'saved' && <span>Saved</span>}
    {saveStatus === 'error' && <span>Error saving</span>}
  </div>
);
```

**Benefits**:
- User knows save is pending
- User sees confirmation when saved
- User sees error if save fails

### Strategy 4: Save on Blur/Unmount

**Prevent data loss by flushing debounced saves**:

```typescript
// Save immediately when editor loses focus
const handleBlur = () => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
    performSaveImmediately();
  }
};

// Save before unmount
useEffect(() => {
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      performSaveImmediately();
    }
  };
}, []);

// Save before page unload
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (saveTimeoutRef.current) {
      e.preventDefault();
      e.returnValue = ''; // Show browser warning
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
```

**Benefits**:
- Reduces data loss from navigation
- Warns user if unsaved changes exist

### Strategy 5: Retry Failed Saves

**Implementation**:
```typescript
const saveWithRetry = async (updates: any, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await supabase.rpc("update_note", updates);
      return; // Success
    } catch (error) {
      if (i === retries - 1) throw error; // Last retry failed
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
    }
  }
};
```

**Benefits**:
- Recovers from transient network failures
- Exponential backoff prevents overwhelming server

### Strategy 6: Offline Support with IndexedDB

**For advanced use cases**:

```typescript
import { openDB } from 'idb';

// Queue saves in IndexedDB
const queueSave = async (noteId: string, updates: any) => {
  const db = await openDB('notes-queue', 1, {
    upgrade(db) {
      db.createObjectStore('saves');
    },
  });

  await db.put('saves', { noteId, updates, timestamp: Date.now() }, noteId);
};

// Process queue when online
const processSaveQueue = async () => {
  const db = await openDB('notes-queue', 1);
  const saves = await db.getAll('saves');

  for (const save of saves) {
    try {
      await supabase.rpc("update_note", save.updates);
      await db.delete('saves', save.noteId);
    } catch (error) {
      console.error("Failed to process queued save:", error);
    }
  }
};

// Listen for online event
window.addEventListener('online', processSaveQueue);
```

**Benefits**:
- Saves work offline
- Syncs when connection restored
- Prevents all data loss

## Implementation Example

### Optimized Save Function

```typescript
// /workspace/repo/components/note.tsx
const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

const saveNote = useCallback(
  (updates: Partial<Note>) => {
    // 1. Optimistic update (immediate)
    setNote((prevNote) => {
      const updatedNote = { ...prevNote, ...updates };
      noteRef.current = updatedNote;
      return updatedNote;
    });

    // 2. Accumulate updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // 3. Mark as saving
    setSaveStatus('saving');

    // 4. Debounce (500ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const pendingUpdates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = {};

      try {
        // 5. Single RPC call with optional fields
        await supabase.rpc("update_note", {
          uuid_arg: note.id,
          session_arg: sessionId,
          title_arg: pendingUpdates.title || null,
          emoji_arg: pendingUpdates.emoji || null,
          content_arg: pendingUpdates.content || null,
        });

        // 6. Only revalidate if public note
        if (note.public) {
          await fetch("/notes/revalidate", { slug: note.slug });
          router.refresh();
        }

        // 7. Mark as saved
        setSaveStatus('saved');
      } catch (error) {
        console.error("Save failed:", error);
        setSaveStatus('error');

        // Retry after 2 seconds
        setTimeout(() => {
          saveNote(pendingUpdates);
        }, 2000);
      }
    }, 500);
  },
  [note, sessionId, router]
);

// 8. Save on blur
const handleBlur = () => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
    performSaveImmediately();
  }
};

// 9. Save before unmount
useEffect(() => {
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      performSaveImmediately();
    }
  };
}, []);

// 10. Warn before page unload if unsaved
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (saveTimeoutRef.current) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
```

## Performance Monitoring

### Measure Save Performance

**Add logging**:
```typescript
const saveNote = useCallback((updates: Partial<Note>) => {
  const startTime = performance.now();

  // ... save logic

  setTimeout(async () => {
    try {
      await supabase.rpc("update_note", { ... });

      const endTime = performance.now();
      console.log(`Save took ${endTime - startTime}ms`);
    } catch (error) {
      console.error("Save failed after", performance.now() - startTime, "ms");
    }
  }, 500);
}, []);
```

**Track metrics**:
- Time from user input to database write
- Number of saves per session
- Save failure rate
- Network latency

### Performance Targets

**Good Performance**:
- ✅ Debounce delay: 300-500ms
- ✅ Database write: < 200ms
- ✅ Total save time: < 1s
- ✅ Save failure rate: < 1%

**Poor Performance**:
- ❌ Debounce delay: > 1s (too laggy)
- ❌ Database write: > 1s (network issues)
- ❌ Total save time: > 2s (user frustration)
- ❌ Save failure rate: > 5% (unreliable)

## Testing Save Behavior

### Test Case 1: Rapid Typing
1. Type quickly in editor
2. Verify only 1 save after stopping
3. Check database has latest content

### Test Case 2: Navigation
1. Type in editor
2. Immediately click link (before 500ms)
3. Verify content is saved
4. Check no data loss

### Test Case 3: Network Failure
1. Open DevTools → Network tab
2. Throttle to "Offline"
3. Type in editor
4. Go back online
5. Verify save retries and succeeds

### Test Case 4: Multiple Fields
1. Change title, emoji, and content
2. Verify single RPC call (not 3 separate calls)
3. Check database has all updates

### Test Case 5: Page Reload
1. Type in editor
2. Wait 400ms (before save)
3. Reload page
4. Check if content is saved (should show warning)

## Related Files

- Note editor: `/workspace/repo/components/note.tsx`
- Note header (title/emoji): `/workspace/repo/components/note-header.tsx`
- Note content (markdown): `/workspace/repo/components/note-content.tsx`
- Session context: `/workspace/repo/app/notes/session-notes.tsx`
- RPC functions: `/workspace/repo/supabase/migrations/20240710180237_initial.sql`

## Additional Resources

- [Debouncing and Throttling Explained](https://css-tricks.com/debouncing-throttling-explained-examples/)
- [Optimistic UI Updates](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- Repository architecture: `/workspace/repo/ARCHITECTURE.md` (see "Performance Bottlenecks" section)
