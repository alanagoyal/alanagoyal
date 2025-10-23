# Migration Instructions - Fix Note Title Save Issue

## Overview

This migration fixes a critical race condition where updating the note title and quickly switching to the content field would result in the title not being saved.

## Root Cause

The issue was caused by a shared debounce timeout that would cancel pending updates when a new field was edited:

1. User updates title → starts 500ms timer
2. User quickly switches to content and types → **cancels title timer**, starts new timer
3. Only content is saved, title is lost

## Solution Implemented

### 1. Database Migration

**File:** `/root/repo/supabase/migrations/20251023000000_add_partial_update_function.sql`

Creates a new `update_note_partial` function that allows updating only the fields that have changed, using a single database call.

**To apply this migration:**

```bash
# If using Supabase CLI locally
npx supabase db push

# Or apply directly in Supabase Dashboard
# Copy the contents of the migration file and run in SQL Editor
```

### 2. Component Changes

**Files Modified:**
- `components/note.tsx` - Main save logic with accumulated updates
- `components/note-header.tsx` - Title field with immediate save on blur
- `components/note-content.tsx` - Content field with immediate save on blur

**Key Improvements:**

1. **Accumulated Updates**: Instead of clearing pending changes, the new system accumulates all field updates
2. **Single Database Call**: All pending changes are saved in one RPC call
3. **Immediate Save on Blur**: When you leave a field, changes are immediately flushed to prevent data loss
4. **Save on Unmount**: Component cleanup ensures no pending changes are lost
5. **Reduced Refreshes**: Only refreshes session notes when title/emoji changes (not content)

## Architecture Improvements

### Before (Problems)

```typescript
// Each field update canceled previous pending updates
saveNote({ title: "new" })  // starts timer
saveNote({ content: "new" }) // CANCELS title timer, only saves content
```

### After (Fixed)

```typescript
// Field updates accumulate
saveNote({ title: "new" })     // adds to pending: { title: "new" }
saveNote({ content: "new" })   // adds to pending: { title: "new", content: "new" }
// Both saved together after 500ms OR immediately on blur
```

### Performance Benefits

1. **Reduced Database Calls**: 1 call instead of up to 3 separate RPC calls
2. **Smarter Refreshes**: Session notes only refresh when sidebar-visible fields change
3. **Better UX**: No data loss, faster saves, less network traffic

## Testing the Fix

1. Create or edit a note
2. Update the title field
3. **Immediately** click into the content field and start typing
4. Wait for auto-save or blur the content field
5. Refresh the page
6. **Expected**: Both title and content are saved correctly

## Rollback Plan

If you need to rollback:

1. Revert the component changes:
   ```bash
   git revert <commit-hash>
   ```

2. The database migration is backward compatible - old code can still use the individual update functions (`update_note_title`, `update_note_content`, `update_note_emoji`)

## Additional Notes

- The sentinel value `'___NO_UPDATE___'` is used to distinguish between "don't update this field" and "set this field to empty string"
- The migration is additive - it doesn't remove existing RPC functions
- All changes are TypeScript-verified with no compilation errors
