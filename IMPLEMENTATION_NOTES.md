# Note Creation & Saving Implementation Notes

## Overview
This document explains the implementation of the optimistic UI system for note creation and saving.

## Key Components

### 1. Field-Level Debouncing (`components/note.tsx`)
Each field (title, content, emoji) has its own independent debounce timer (500ms). This prevents race conditions where changing one field cancels another field's save.

**Example:**
- User types title → starts 500ms timer for title
- User tabs to content → title timer is flushed immediately, title saves to DB
- User types content → starts separate 500ms timer for content
- **Result:** Both fields save correctly ✅

### 2. Optimistic Updates (`app/notes/session-notes.tsx`)
When a field changes, we update:
1. **Local component state** (immediate UI feedback)
2. **Session context** (keeps sidebar in sync)
3. **Database** (after debounce or on blur)

This three-tier update ensures the UI is always responsive.

### 3. Context Synchronization (`components/note.tsx:29-39`)
When navigating to a note, we check if the context has more recent data than the server:

```typescript
useEffect(() => {
  const contextNote = notes.find(n => n.id === initialNote.id);
  if (contextNote && pendingSaves.current.size === 0) {
    setNote(contextNote);
  }
}, [notes, initialNote.id]);
```

**Why this matters:**
- User makes changes and navigates away before DB save completes
- Context has optimistic updates
- When user navigates back, server fetches from DB (stale data)
- This effect syncs the fresh context data → user sees their changes ✅

## Flow Diagrams

### Rapid Editing Flow
```
1. Type title "My Note"
   ├─ Update local state ✅
   ├─ Update context ✅
   └─ Start 500ms DB save timer

2. Tab to content (blur event)
   ├─ Cancel timer
   ├─ Flush title save to DB immediately
   └─ Context still has "My Note" ✅

3. Type content "Hello world"
   ├─ Update local state ✅
   ├─ Update context ✅
   └─ Start separate 500ms DB save timer

4. Navigate away (unmount)
   └─ Flush content save to DB (fire-and-forget)
      Context has both updates ✅

5. Navigate back
   ├─ Server fetches from DB (may be stale)
   ├─ Context has latest updates
   └─ Sync from context → UI shows latest ✅
```

### New Note Creation Flow
```
1. Click "New Note"
   ├─ Generate UUID
   ├─ Create note object
   └─ Add to context immediately ✅

2. Navigate to /notes/new-note-{uuid}
   └─ Navigation is instant (no DB wait) ✅

3. Server renders page
   ├─ Try to fetch from DB
   ├─ Not found (not persisted yet)
   ├─ Detect "new-note-" pattern
   └─ Return temp note object ✅

4. Client mounts Note component
   ├─ Receives temp note from server
   ├─ Syncs with context note (has emoji, etc)
   └─ Title input auto-focused and ready ✅

5. Background persistence
   └─ DB insert completes (async) ✅
```

## Edge Cases Handled

### 1. Navigate Away Before Save Completes
✅ **Solved:** Context holds optimistic update, syncs on return

### 2. Multiple Field Changes Rapidly
✅ **Solved:** Independent timers per field

### 3. Browser Close with Unsaved Changes
✅ **Partial:** Shows browser warning, attempts save
⚠️  **Note:** Can't guarantee save completes if browser force-closes

### 4. Offline Editing
⚠️  **Not yet implemented:** Would need service worker + sync queue

### 5. Concurrent Edits from Multiple Devices
⚠️  **Not handled:** Last write wins (Supabase RLS prevents cross-session conflicts)

## Performance Benefits

- **Instant UI:** No waiting for DB on any user action
- **Reduced Queries:** Context updates instead of refetching
- **Batched Saves:** Multiple field changes can be flushed together
- **No Redundant Refetches:** `router.refresh()` removed from save flow

## Future Enhancements

1. **Save Indicators:** Show "Saving..." / "Saved" per field
2. **Retry Logic:** Automatic retry on failed saves
3. **Conflict Resolution:** Handle concurrent edits gracefully
4. **Offline Queue:** Persist changes locally when offline
5. **Consolidated RPC:** Single `update_note` function instead of 3 separate calls

## Testing Checklist

- [ ] Create new note → title input is immediately focused
- [ ] Type title rapidly → title saves correctly
- [ ] Type title, tab to content, type content → both save
- [ ] Make changes, navigate away, navigate back → changes visible
- [ ] Close browser tab → shows "unsaved changes" warning
- [ ] Edit note, create new note → first note's changes persist
- [ ] Delete note with pending saves → no errors
- [ ] Emoji change → saves and displays correctly
- [ ] Checkbox toggle in markdown → saves state

## Known Limitations

1. **Browser Force-Close:** Pending saves lost if browser crashes
2. **Slow Network:** User may navigate back before save completes, but will still see optimistic update
3. **Session Storage:** Notes tied to browser session (by design)

## Migration Notes

### Breaking Changes
None - fully backward compatible

### Required Database Changes
None - uses existing RPC functions

### Optional Optimization
Create consolidated `update_note` RPC function:
```sql
CREATE OR REPLACE FUNCTION update_note(
  uuid_arg UUID,
  session_arg UUID,
  title_arg TEXT DEFAULT NULL,
  content_arg TEXT DEFAULT NULL,
  emoji_arg TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE notes
  SET
    title = COALESCE(title_arg, title),
    content = COALESCE(content_arg, content),
    emoji = COALESCE(emoji_arg, emoji),
    updated_at = NOW()
  WHERE id = uuid_arg AND session_id = session_arg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Then update `lib/note-persistence.ts` to use this instead of 3 separate calls.
