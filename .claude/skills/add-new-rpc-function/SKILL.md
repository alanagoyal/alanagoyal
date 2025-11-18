---
name: add-new-rpc-function
description: This skill guides you through adding a new Supabase RPC function to the notes application, following the repository's security patterns and conventions.
---

## When to Use This Skill

- Adding new database operations (create, update, delete)
- Implementing new note features that require database access
- Need to enforce session-based security on database operations

## Repository Context

This notes app uses Supabase RPC functions with `SECURITY DEFINER` for all write operations. This bypasses Row Level Security (RLS) while enforcing session-based access control in the function logic.

**Critical Pattern**: All write RPC functions MUST verify `session_id` matches to prevent unauthorized access.

## Step-by-Step Process

### Step 1: Create Migration File

Create a new SQL migration file in `/workspace/repo/supabase/migrations/`:

```bash
cd /workspace/repo/supabase/migrations
# Create file with format: YYYYMMDDHHMMSS_description.sql
# Example: 20241118162000_add_favorite_toggle.sql
```

### Step 2: Write the RPC Function

**Template for Write Operations** (update, delete):
```sql
CREATE OR REPLACE FUNCTION public.function_name(
  uuid_arg uuid,
  session_arg uuid,
  data_arg text  -- Add more parameters as needed
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET field = data_arg
    WHERE id = uuid_arg AND session_id = session_arg;
    -- ⚠️ CRITICAL: Always include "AND session_id = session_arg" in WHERE clause
END;
$function$;
```

**Template for Read Operations**:
```sql
CREATE OR REPLACE FUNCTION public.select_something(
  session_id_arg uuid
)
RETURNS SETOF notes
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT * FROM public.notes
    WHERE session_id = session_id_arg;
END;
$function$;
```

### Step 3: Grant Execute Permissions

Add this after the function definition:
```sql
GRANT EXECUTE ON FUNCTION public.function_name TO anon;
GRANT EXECUTE ON FUNCTION public.function_name TO authenticated;
```

### Step 4: Apply Migration

**Local Development**:
```bash
cd /workspace/repo
supabase db push
```

**Production** (Supabase Dashboard):
1. Navigate to: Supabase Dashboard → SQL Editor
2. Copy the migration SQL
3. Paste and run
4. Verify in Database → Functions

### Step 5: Update TypeScript Types (if needed)

If adding new fields to notes, update `/workspace/repo/lib/types.ts`:

```typescript
export interface Note {
  id: string;
  slug: string;
  title: string;
  content: string;
  created_at: string;
  session_id: string;
  emoji?: string;
  public: boolean;
  category?: string;
  new_field?: string;  // Add your new field here
}
```

### Step 6: Call from Client Code

**In Client Components** (e.g., `/workspace/repo/components/note.tsx`):

```typescript
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// Call the RPC function
const { error } = await supabase.rpc("function_name", {
  uuid_arg: noteId,
  session_arg: sessionId,
  data_arg: newValue,
});

if (error) {
  console.error("RPC error:", error);
  // Handle error (show toast, etc.)
}
```

**In Server Components** (e.g., `/workspace/repo/app/notes/[slug]/page.tsx`):

```typescript
import { createClient } from "@/utils/supabase/server";

const supabase = createClient();

const { data } = await supabase.rpc("function_name", {
  uuid_arg: noteId,
  session_arg: sessionId,
  data_arg: newValue,
});
```

### Step 7: Refresh Session Notes Context

After write operations, refresh the session notes context to sync UI:

```typescript
// After RPC call
await supabase.rpc("function_name", { ... });

// Refresh session notes (available in components via useContext)
refreshSessionNotes();
```

### Step 8: Revalidate ISR Cache (if affecting public notes)

If the RPC function affects public notes, revalidate the ISR cache:

```typescript
// Revalidate specific note page
await fetch("/notes/revalidate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
  },
  body: JSON.stringify({ slug: note.slug }),
});

// OR revalidate layout (sidebar) if note added/removed
await fetch("/notes/revalidate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
  },
  body: JSON.stringify({ layout: true }),
});
```

## Existing RPC Functions Reference

Located in `/workspace/repo/supabase/migrations/20240710180237_initial.sql`:

1. **`select_note(note_slug_arg)`** - Lines 36-45
   - Fetch single note by slug
   - Returns public notes OR notes matching session_id

2. **`select_session_notes(session_id_arg)`** - Lines 47-56
   - Fetch all notes for a session
   - Used by SessionNotesContext

3. **`update_note_title(uuid_arg, session_arg, title_arg)`** - Lines 99-109
   - Update note title
   - Enforces session ownership

4. **`update_note_emoji(uuid_arg, session_arg, emoji_arg)`** - Lines 86-97
   - Update note emoji

5. **`update_note_content(uuid_arg, session_arg, content_arg)`** - Lines 73-84
   - Update note content

6. **`update_note(uuid_arg, session_arg, title_arg, emoji_arg, content_arg)`** - Lines 58-71
   - Bulk update function (currently unused in codebase)

7. **`delete_note(uuid_arg, session_arg)`** - Lines 24-34
   - Delete note
   - Enforces session ownership

## Security Checklist

✅ Function uses `SECURITY DEFINER`
✅ Write operations include `WHERE session_id = session_arg`
✅ Function parameters include both `uuid_arg` AND `session_arg`
✅ GRANT statements added for `anon` and `authenticated` roles
✅ No SQL injection risk (using parameterized queries)
✅ Function returns appropriate type (void for writes, SETOF for reads)

## Common Pitfalls

❌ **Forgetting session check in WHERE clause**
```sql
-- BAD: Anyone can update any note
UPDATE notes SET field = value WHERE id = uuid_arg;

-- GOOD: Only session owner can update
UPDATE notes SET field = value WHERE id = uuid_arg AND session_id = session_arg;
```

❌ **Using wrong Supabase client**
```typescript
// BAD: Server client in Client Component
"use client";
import { createClient } from "@/utils/supabase/server";

// GOOD: Browser client in Client Component
"use client";
import { createClient } from "@/utils/supabase/client";
```

❌ **Not refreshing session notes after mutation**
```typescript
// BAD: UI gets out of sync
await supabase.rpc("update_note_title", { ... });
// User won't see update in sidebar

// GOOD: UI stays in sync
await supabase.rpc("update_note_title", { ... });
refreshSessionNotes();
```

## Example: Adding a "Favorite" Feature

**1. Migration** (`20241118_add_favorite.sql`):
```sql
-- Add column
ALTER TABLE notes ADD COLUMN favorited BOOLEAN DEFAULT false;

-- Create toggle function
CREATE OR REPLACE FUNCTION public.toggle_note_favorite(
  uuid_arg uuid,
  session_arg uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET favorited = NOT favorited
    WHERE id = uuid_arg AND session_id = session_arg;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.toggle_note_favorite TO anon;
GRANT EXECUTE ON FUNCTION public.toggle_note_favorite TO authenticated;
```

**2. Update types** (`/workspace/repo/lib/types.ts`):
```typescript
export interface Note {
  // ... existing fields
  favorited?: boolean;
}
```

**3. Call from component** (`/workspace/repo/components/note-header.tsx`):
```typescript
const handleFavoriteToggle = async () => {
  // Optimistic update
  setNote((prev) => ({ ...prev, favorited: !prev.favorited }));

  // Call RPC
  const { error } = await supabase.rpc("toggle_note_favorite", {
    uuid_arg: note.id,
    session_arg: sessionId,
  });

  if (error) {
    // Rollback optimistic update
    setNote((prev) => ({ ...prev, favorited: !prev.favorited }));
    toast({ title: "Failed to toggle favorite" });
  } else {
    refreshSessionNotes();
  }
};
```

## Related Files

- Database schema: `/workspace/repo/supabase/migrations/20240710180237_initial.sql`
- Note types: `/workspace/repo/lib/types.ts`
- Server Supabase client: `/workspace/repo/utils/supabase/server.ts`
- Browser Supabase client: `/workspace/repo/utils/supabase/client.ts`
- Note editor (example usage): `/workspace/repo/components/note.tsx`
- Session context: `/workspace/repo/app/notes/session-notes.tsx`

## Additional Resources

- [Supabase RPC Documentation](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL PL/pgSQL Guide](https://www.postgresql.org/docs/current/plpgsql.html)
- Repository architecture: `/workspace/repo/ARCHITECTURE.md`
