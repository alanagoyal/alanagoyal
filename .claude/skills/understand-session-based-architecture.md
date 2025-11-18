# Understand Session-Based Architecture

This skill explains the unique session-based authentication and note ownership model in this notes application.

## When to Use This Skill

- Understanding how notes are associated with users
- Debugging session or access issues
- Adding features that need to respect session ownership
- Understanding security model for the application

## Overview

This app uses a **session-based architecture WITHOUT traditional authentication**:
- ❌ No email/password login
- ❌ No user accounts
- ❌ No OAuth or social login
- ✅ Browser-generated UUID as session identifier
- ✅ Stored in localStorage (persists across page reloads)
- ✅ Session ID links private notes to browser

## Architecture Components

### 1. Session ID Generation

**Location**: `/workspace/repo/components/session-id.tsx`

```typescript
useEffect(() => {
  const currentSessionId = localStorage.getItem("session_id") || uuidv4();
  if (!localStorage.getItem("session_id")) {
    localStorage.setItem("session_id", currentSessionId);
  }
  setSessionId(currentSessionId);
}, [setSessionId]);
```

**Flow**:
1. Component mounts (rendered in Sidebar and Note components)
2. Check `localStorage.session_id`
3. If not found:
   - Generate new UUIDv4 using `uuid` library
   - Store in localStorage
4. Call `setSessionId()` callback to propagate to parent

**Storage**: `localStorage.getItem("session_id")`

**Format**: Standard UUIDv4 (e.g., `123e4567-e89b-12d3-a456-426614174000`)

**Lifecycle**: Persists until user clears browser data

### 2. Session Notes Context

**Location**: `/workspace/repo/app/notes/session-notes.tsx`

```typescript
export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  setSessionId: () => {},
  refreshSessionNotes: async () => {},
});

export function SessionNotesProvider({ children }) {
  const [sessionId, setSessionId] = useState("");
  const [notes, setNotes] = useState([]);

  const refreshSessionNotes = useCallback(async () => {
    if (sessionId) {
      const notes = await getSessionNotes({ supabase, sessionId });
      setNotes(notes || []);
    }
  }, [supabase, sessionId]);

  useEffect(() => {
    refreshSessionNotes(); // Auto-refresh when sessionId changes
  }, [sessionId]);

  return (
    <SessionNotesContext.Provider value={{ sessionId, notes, setSessionId, refreshSessionNotes }}>
      {children}
    </SessionNotesContext.Provider>
  );
}
```

**Provides**:
- `sessionId`: Current browser's session UUID
- `notes`: Array of notes belonging to this session
- `setSessionId`: Function to update session ID
- `refreshSessionNotes`: Function to refetch session notes

**Wrapped around**: Entire app in `/workspace/repo/components/sidebar-layout.tsx`

### 3. Database Schema

**Location**: `/workspace/repo/supabase/migrations/20240710180237_initial.sql`

```sql
create table "public"."notes" (
    "id" uuid not null default gen_random_uuid(),
    "title" text,
    "content" text,
    "created_at" timestamp with time zone not null default now(),
    "public" boolean,
    "session_id" uuid,  -- Links note to browser session
    "slug" text,
    "category" text,
    "emoji" text
);

-- Index for performance
CREATE INDEX session_id_index ON notes (session_id);
```

**Key field**: `session_id` (uuid) - Links notes to browser sessions

### 4. Row Level Security (RLS)

**Location**: `/workspace/repo/supabase/migrations/20240710180237_initial.sql`

**Policy 1: Public Notes (SELECT)**
```sql
create policy "allow_all_users_select_public_notes"
on "public"."notes"
as permissive
for select
to public
using ((public = true));
```
- Anyone can read public notes
- No session check needed

**Policy 2: Private Notes (INSERT)**
```sql
create policy "allow_all_users_insert_private_notes"
on "public"."notes"
as permissive
for insert
to public
with check ((public = false));
```
- Anyone can create private notes
- Automatically linked to their session ID

**Policy 3: No Direct SELECT on Private Notes**
- RLS blocks direct SELECT on `public = false` notes
- Access only via RPC functions that check session ownership

### 5. RPC Function Security

All write operations enforce session ownership.

**Example: Update Note Content**
```sql
CREATE OR REPLACE FUNCTION public.update_note_content(
  uuid_arg uuid,
  session_arg uuid,
  content_arg text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET content = content_arg
    WHERE id = uuid_arg AND session_id = session_arg;
    -- ⚠️ CRITICAL: "AND session_id = session_arg" prevents unauthorized access
END;
$function$;
```

**Security Pattern**:
1. `SECURITY DEFINER`: Runs with creator privileges (bypasses RLS)
2. `WHERE session_id = session_arg`: Enforces session ownership
3. No error if not found: Prevents leaking note existence

## Public vs Private Notes

### Public Notes
```typescript
{
  id: "123e4567-...",
  slug: "about-me",  // Hand-crafted slug
  title: "About Me",
  content: "# Hi, I'm...",
  public: true,  // ← Public flag
  session_id: "owner-uuid",  // Site owner's session
  emoji: "👋",
  category: "today"
}
```

**Characteristics**:
- ✅ Visible to everyone
- ✅ Appear in sidebar for all visitors
- ✅ Cached with ISR (24 hours)
- ✅ Pre-rendered at build time
- ❌ Cannot be edited by visitors (only site owner)
- ❌ Cannot be deleted by visitors

**Access**:
```sql
-- Anyone can SELECT
SELECT * FROM notes WHERE public = true;
```

### Private Notes
```typescript
{
  id: "987fcdeb-...",
  slug: "new-note-987fcdeb...",  // UUID-based slug
  title: "My Private Note",
  content: "# Private thoughts...",
  public: false,  // ← Private flag
  session_id: "visitor-uuid",  // Visitor's session
  emoji: "📝",
  category: "today"
}
```

**Characteristics**:
- ✅ Only visible to creator (session owner)
- ✅ Can be edited/deleted by creator
- ✅ Not cached (always dynamic rendering)
- ✅ Appear in sidebar only for creator
- ❌ Not in generateStaticParams (not pre-rendered)
- ❌ Cannot be accessed by other sessions

**Access**:
```sql
-- Must use RPC function with session check
SELECT * FROM select_session_notes(session_id);
```

## How Session Ownership Works

### Scenario 1: Creating a Note

**Flow**:
```typescript
// 1. User clicks "New Note" button
// 2. createNote function called
const noteId = uuidv4();
const slug = `new-note-${noteId}`;

const note = {
  id: noteId,
  slug: slug,
  title: "",
  content: "",
  public: false,
  session_id: sessionId,  // ← Current browser's session ID
  category: "today",
  emoji: "👋🏼",
};

// 3. Insert to database
await supabase.from("notes").insert(note);

// 4. Note is now linked to this browser session
```

**Result**: Note is created with `session_id = {current-browser-uuid}`

### Scenario 2: Updating a Note

**Flow**:
```typescript
// 1. User types in note editor
// 2. After 500ms debounce, saveNote called
await supabase.rpc("update_note_content", {
  uuid_arg: note.id,
  session_arg: sessionId,  // ← Current browser's session ID
  content_arg: newContent,
});

// 3. RPC function checks:
// WHERE id = uuid_arg AND session_id = session_arg
// If session doesn't match → no update (silent fail)
```

**Result**: Only session owner can update their notes

### Scenario 3: Deleting a Note

**Flow**:
```typescript
// 1. User presses 'd' key or clicks delete
// 2. handleNoteDelete called
const { error } = await supabase.rpc("delete_note", {
  uuid_arg: note.id,
  session_arg: sessionId,  // ← Current browser's session ID
});

// 3. RPC function checks:
// WHERE id = uuid_arg AND session_id = session_arg
// If session doesn't match → no delete
```

**Result**: Only session owner can delete their notes

### Scenario 4: Viewing Notes (Sidebar)

**Flow**:
```typescript
// 1. Sidebar combines two sources:
const publicNotes = props.notes;  // From server layout (cached)
const { notes: sessionNotes } = useContext(SessionNotesContext);

// 2. Merge and display
const allNotes = [...publicNotes, ...sessionNotes];
```

**Result**: User sees public notes (everyone) + their private notes (session-specific)

## Security Model

### What's Protected

✅ **Private notes are session-specific**
- Cannot access other sessions' notes
- RPC functions enforce `session_id` match

✅ **Public notes are read-only for visitors**
- Cannot edit/delete unless you're the owner
- Checked in UI (not in database layer)

✅ **No SQL injection**
- RPC functions use parameterized queries
- No raw SQL from client

### What's NOT Protected

❌ **No password protection**
- Anyone with session ID UUID can access notes
- If someone copies localStorage → full access

❌ **No session expiration**
- Sessions never expire
- Persist until browser data cleared

❌ **No revocation mechanism**
- Can't "logout" or invalidate session
- Can't remotely revoke access

❌ **No rate limiting**
- Users can create unlimited notes
- Can spam database (DoS risk)

❌ **Browser-specific**
- Notes don't sync across devices
- Incognito mode = new session = can't see previous notes

### Security Is Sufficient For:
- Personal note-taking
- Public portfolio/blog notes
- Demo applications
- Non-sensitive data
- Single-device usage

### NOT Suitable For:
- Multi-user collaboration
- Sensitive/confidential data
- Production apps requiring compliance (GDPR, HIPAA)
- Cross-device sync
- Shared editing

## Common Scenarios

### Scenario 1: User Clears Browser Data

**What happens**:
1. `localStorage.session_id` is deleted
2. Next page load generates new session ID
3. User loses access to all previous notes

**Notes still exist in database**:
```sql
-- Old notes still there, but orphaned
SELECT * FROM notes WHERE session_id = '{old-session-id}';
```

**Solution**: No built-in recovery mechanism. User must know old session ID to manually set:
```javascript
localStorage.setItem("session_id", "old-session-id-here");
```

### Scenario 2: User Switches Browsers

**What happens**:
1. New browser = new localStorage
2. New session ID generated
3. Cannot see notes from other browser

**Workaround**: Export session ID from Browser A, import to Browser B:
```javascript
// Browser A
const sessionId = localStorage.getItem("session_id");
console.log(sessionId); // Copy this UUID

// Browser B
localStorage.setItem("session_id", "uuid-from-browser-a");
location.reload();
```

### Scenario 3: Incognito Mode

**What happens**:
1. Incognito mode = separate localStorage
2. New session ID generated
3. Cannot access regular browser's notes

**Workaround**: Manually set session ID in incognito:
```javascript
localStorage.setItem("session_id", "regular-browser-session-id");
```

### Scenario 4: Debugging Access Issues

**Check session ID**:
```javascript
// Open browser console
localStorage.getItem("session_id");
// Copy UUID
```

**Query database**:
```sql
-- In Supabase SQL Editor
SELECT id, slug, title, created_at, session_id
FROM notes
WHERE session_id = 'uuid-from-above';
```

**Verify RPC function**:
```javascript
// In browser console
const supabase = createBrowserClient();
const { data, error } = await supabase.rpc("select_session_notes", {
  session_id_arg: localStorage.getItem("session_id")
});
console.log(data, error);
```

## Extending the Session Model

### Option 1: Add Session Expiration

```sql
-- Add expiration field
ALTER TABLE notes ADD COLUMN session_expires_at TIMESTAMP;

-- Update RPC functions to check expiration
WHERE session_id = session_arg AND (session_expires_at IS NULL OR session_expires_at > NOW())
```

### Option 2: Add Session Names

```sql
-- Add session tracking table
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link notes to sessions
ALTER TABLE notes ADD CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES sessions(id);
```

### Option 3: Add Multi-Device Sync

```sql
-- Add device tracking
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  device_name TEXT,
  last_seen TIMESTAMP
);
```

### Option 4: Add Password Protection

```sql
-- Add password to sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  password_hash TEXT,  -- bcrypt hash
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verify password in RPC function
-- (Requires authentication layer)
```

## Related Files

- Session ID generator: `/workspace/repo/components/session-id.tsx`
- Session context: `/workspace/repo/app/notes/session-notes.tsx`
- Database schema: `/workspace/repo/supabase/migrations/20240710180237_initial.sql`
- Note creation: `/workspace/repo/lib/create-note.ts`
- Sidebar (merges notes): `/workspace/repo/components/sidebar.tsx`
- Note editor: `/workspace/repo/components/note.tsx`

## Additional Resources

- [UUID RFC4122](https://datatracker.ietf.org/doc/html/rfc4122)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- Repository architecture: `/workspace/repo/ARCHITECTURE.md` (see "Session Management" section)
