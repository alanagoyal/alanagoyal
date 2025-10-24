# Architecture Documentation

## Overview

This is a Next.js 14 notes application with a session-based architecture. The app supports two types of notes:
- **Public notes**: Managed by the site owner, visible to all users
- **Private notes**: Session-specific notes that only the creator can see and edit

The app uses server-side rendering (SSR) with Incremental Static Regeneration (ISR) for public notes, and dynamic rendering for private user notes.

## Tech Stack

### Core Framework
- **Next.js 14.1.2** - App Router with React Server Components
- **React 18+** - UI library with Server/Client Component split
- **TypeScript** - Type safety throughout the application

### Backend & Database
- **Supabase** - PostgreSQL database with Row Level Security (RLS)
- **@supabase/ssr** - SSR-optimized Supabase client
- Custom RPC functions for data operations

### UI & Styling
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Headless accessible UI components
- **next-themes** - Theme management (dark/light mode)
- **Lucide React** - Icon library

### Content & Markdown
- **react-markdown** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown support
- **emoji-mart** - Emoji picker

### Utilities
- **uuid** - Session ID and note ID generation
- **date-fns** - Date formatting and manipulation

## Architecture Patterns

### Rendering Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     Root Layout (Server)                     │
│  - Fetches public notes from Supabase                       │
│  - Cached for 24 hours (revalidate = 86400)                 │
│  - Uses server-side Supabase client                         │
│  - Wraps app with ThemeProvider + SessionNotesProvider      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐   ┌─────────▼──────────┐
│  /notes (Server) │   │ /notes/[slug]      │
│  - Home page     │   │ (Server + ISR)     │
│  - Metadata only │   │ - revalidate: 86400│
└──────────────────┘   │ - Static params    │
                       │ - React cache()    │
                       │ - Dynamic rendering│
                       └────────────────────┘
```

### Client vs Server Components

#### Server Components (Default)
- `app/notes/layout.tsx` - Root layout with public notes fetch
- `app/notes/page.tsx` - Home page (metadata only)
- `app/notes/[slug]/page.tsx` - Individual note pages with ISR
- `app/sitemap.ts` - Dynamic sitemap generation
- `components/sidebar-content.tsx` - Note list rendering

#### Client Components ('use client')
- `components/sidebar.tsx` - Sidebar with keyboard shortcuts, search
- `components/note.tsx` - Note editor with debounced saves
- `components/note-header.tsx` - Title and emoji editor
- `components/note-content.tsx` - Markdown editor/viewer
- `components/new-note.tsx` - New note creation button
- `components/command-menu.tsx` - Cmd+K command palette
- `components/search.tsx` - Search bar with live filtering
- `components/session-id.tsx` - Session ID manager
- `components/sidebar-layout.tsx` - Responsive layout wrapper
- `app/notes/session-notes.tsx` - Session notes context provider
- `components/theme-provider.tsx` - Theme context wrapper

## Component Structure

### Component Hierarchy

```
app/notes/layout.tsx (Server)
└── ThemeProvider
    └── SidebarLayout (Client)
        ├── SessionNotesProvider (Context)
        │   ├── Sidebar (Client)
        │   │   ├── Nav
        │   │   ├── CommandMenu
        │   │   ├── SearchBar
        │   │   └── SidebarContent
        │   │       └── NoteItem (multiple)
        │   │           ├── ContextMenu
        │   │           └── SwipeActions
        │   └── ScrollArea
        │       └── children (Note page)
        │           └── Note (Client)
        │               ├── SessionId
        │               ├── NoteHeader
        │               └── NoteContent
        └── Toaster
```

### Key Component Responsibilities

#### `app/notes/layout.tsx` (Server)
- **Purpose**: Root layout that provides public notes to all pages
- **Data Fetching**: Queries Supabase for public notes using server client
- **Revalidation**: `revalidate = 86400` (24 hour cache)
- **Supabase Client**: Uses `createClient()` from `@/utils/supabase/server`

#### `app/notes/[slug]/page.tsx` (Server)
- **Purpose**: Individual note page with ISR
- **Data Fetching**: Uses `select_note` RPC with React `cache()` deduplication
- **Revalidation**: ISR with 24 hour cache (`revalidate = 86400`)
- **Static Generation**: Pre-renders public notes at build time
- **Dynamic Params**: Allows runtime note creation for private notes
- **Cache Function**: `getNote = cache(async (slug) => ...)` eliminates duplicate fetches between metadata and page render

#### `components/note.tsx` (Client)
- **Purpose**: Note editor with auto-save and robust data persistence
- **Save Strategy**: Batched updates with accumulated pending changes
- **Debouncing**: 500ms delay before saving accumulated changes
- **Immediate Saves**: Triggered on blur, unmount, and beforeunload
- **Batched RPC**: Single `update_note_batched` call with all field updates
- **Race Condition Prevention**: Pending updates queue accumulates changes instead of replacing them
- **Optimistic Updates**: Context updates for immediate sidebar sync

#### `app/notes/session-notes.tsx` (Client Context)
- **Purpose**: Provides session notes and optimistic update functions
- **Data Fetching**: Calls `select_session_notes` RPC on session change
- **Optimistic Updates**: `updateNote()` and `addNote()` functions update local state immediately
- **No Excessive Refetching**: Save operations use optimistic updates instead of full refetch

## Data Flow

### Note Edit Flow

```
1. User types in note editor (title, emoji, or content)
   │
2. Child component onChange fires
   ├── NoteHeader → saveNote({ title: newTitle })
   ├── NoteHeader → saveNote({ emoji: newEmoji })
   └── NoteContent → saveNote({ content: newContent })
   │
3. saveNote function (accumulated debounce, 500ms)
   ├── Clears previous timeout (but preserves pending updates)
   ├── Updates local state immediately (optimistic update)
   ├── Accumulates updates in pendingUpdatesRef:
   │   └── { ...previousUpdates, ...newUpdates }
   ├── Optimistically updates context for sidebar sync
   ├── Sets new 500ms timeout
   │
4. After 500ms of no edits OR on blur event:
   ├── performSave() executes with ALL accumulated updates
   ├── Single batched RPC call:
   │   └── supabase.rpc("update_note_batched", {
   │         uuid_arg, session_arg,
   │         title_arg: title || null,
   │         emoji_arg: emoji || null,
   │         content_arg: content || null
   │       })
   └── fetch("/notes/revalidate", { slug }) - ISR cache invalidation
   │
5. Immediate save triggers:
   ├── onBlur (title input) → saveImmediately()
   ├── onBlur (content textarea) → saveImmediately()
   ├── onEmojiSelect → saveImmediately()
   ├── onUnmount → performSave()
   └── beforeunload → performSave()
```

**Key Features:**
- Zero race conditions: Updates accumulate instead of being cancelled
- Single database call: Batched RPC for all field updates
- No excessive refetching: Optimistic context updates
- Immediate saves on blur: Prevents data loss
- Beforeunload protection: Saves pending changes before navigation/close

### Note Creation Flow

```
1. User clicks "New Note" button or presses 'N'
   │
2. createNote() function (lib/create-note.ts)
   ├── Generate noteId = uuidv4()
   ├── Generate slug = "new-note-{noteId}"
   ├── Create note object with defaults:
   │   ├── title: ""
   │   ├── content: ""
   │   ├── emoji: "👋🏼"
   │   ├── public: false
   │   ├── session_id: sessionId
   │   └── category: "today"
   │
3. Insert to Supabase
   ├── supabase.from("notes").insert(note)
   │
4. Post-creation flow
   ├── addNewPinnedNote(slug) - adds to localStorage
   ├── addNote(note) - optimistic context update
   ├── router.push(`/notes/${slug}`)
   ├── router.refresh() - sync server components
   └── setSelectedNoteSlug(slug)
   │
5. Toast notification: "Private note created"
```

### Note Delete Flow

```
1. User clicks delete in context menu or presses 'D'
   │
2. handleNoteDelete() in sidebar.tsx
   ├── Check if note is public (prevent deletion)
   ├── supabase.rpc("delete_note", { uuid, session_id })
   │
3. Update local state
   ├── Remove note from groupedNotes (optimistic update)
   ├── Find next note to navigate to
   │
4. Navigate and refresh
   ├── router.push to next note (or /notes/about-me)
   ├── clearSearch()
   ├── refreshSessionNotes() - refetch all session notes
   ├── router.refresh() - refresh server components
   │
5. Toast notification: "Note deleted"
```

## Session Management

### Session ID Generation & Storage

```typescript
// components/session-id.tsx
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
2. Check localStorage for existing `session_id`
3. If not found, generate new UUID with `uuidv4()`
4. Store in localStorage
5. Call `setSessionId` callback to propagate to parent

**Storage Location**: `localStorage.session_id`

**Scope**: Browser-specific (not shared across devices/browsers)

**Lifecycle**: Persists until user clears browser data

### Session Notes Context

```typescript
// app/notes/session-notes.tsx
export const SessionNotesContext = createContext<SessionNotes>({
  sessionId: "",
  notes: [],
  setSessionId: () => {},
  refreshSessionNotes: async () => {},
  updateNote: () => {},
  addNote: () => {},
});
```

**Context Values**:
- `sessionId`: Current user's session UUID
- `notes`: Array of notes belonging to this session
- `setSessionId`: Function to update session ID
- `refreshSessionNotes`: Async function to refetch session notes
- `updateNote`: Optimistically update a note in local state
- `addNote`: Optimistically add a new note to local state

**Provider Location**: Wraps entire app in `sidebar-layout.tsx`

### Authentication & Security

**No Traditional Auth**: The app doesn't use Supabase Auth (email/password)

**Session-Based Security**:
- Each note has a `session_id` field
- RPC functions verify session ownership before updates/deletes
- Row Level Security (RLS) policies enforce access control

**Security Model**:
- Public notes (`public = true`): Anyone can view
- Private notes (`public = false`): Only session owner can view/edit
- Updates/deletes: Require matching `session_id`
- No cross-session access possible

## Database Schema

### Notes Table

```sql
create table "public"."notes" (
    "id" uuid not null default gen_random_uuid(),
    "title" text,
    "content" text,
    "created_at" timestamp with time zone not null default now(),
    "public" boolean,
    "session_id" uuid,
    "slug" text,
    "category" text,
    "emoji" text
);
```

### Key RPC Functions

#### `update_note_batched` (Primary Update Function)
```sql
CREATE OR REPLACE FUNCTION public.update_note_batched(
  uuid_arg uuid,
  session_arg uuid,
  title_arg text DEFAULT NULL,
  emoji_arg text DEFAULT NULL,
  content_arg text DEFAULT NULL
)
```
- **Purpose**: Single batched update for any combination of fields
- **NULL Handling**: Pass NULL for fields you don't want to update
- **Implementation**: Uses COALESCE to preserve existing values for NULL parameters
- **Security**: Verifies session_id before updating

#### `select_note` (Note Lookup)
```sql
CREATE OR REPLACE FUNCTION public.select_note(note_slug_arg text)
```
- **Purpose**: Fetch single note by slug
- **Used By**: ISR page generation, metadata generation
- **Caching**: Wrapped in React cache() to prevent duplicate fetches

#### `select_session_notes` (Session Note List)
```sql
CREATE OR REPLACE FUNCTION public.select_session_notes(session_id_arg uuid)
```
- **Purpose**: Fetch all notes for a session
- **Used By**: SessionNotesContext initialization
- **Trigger**: Called once per session change, not per save

#### `delete_note` (Note Deletion)
```sql
CREATE OR REPLACE FUNCTION public.delete_note(uuid_arg uuid, session_arg uuid)
```
- **Purpose**: Delete a note (session verification required)
- **Security**: Only deletes if session_id matches

## ISR & Revalidation Strategy

### Incremental Static Regeneration (ISR)

**Configuration** (`app/notes/[slug]/page.tsx`):
```typescript
export const revalidate = 86400; // 24 hours
export const dynamicParams = true;

// Cached note fetching to eliminate duplicates
const getNote = cache(async (slug: string) => {
  const supabase = createServerClient();
  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single();
  return note;
});
```

**How it Works**:
1. **Build Time**: Public notes are pre-rendered using `generateStaticParams()`
2. **Runtime**: Cached pages are served for 24 hours
3. **Stale-While-Revalidate**: After 24 hours, Next.js regenerates in background
4. **Dynamic Pages**: Private notes bypass ISR and render on-demand
5. **React cache()**: Eliminates duplicate fetches within same request

### On-Demand Revalidation

**API Route** (`app/notes/revalidate/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  const { slug, layout } = await request.json();
  const token = request.headers.get('x-revalidate-token');

  if (!token || token !== process.env.REVALIDATE_TOKEN) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  // Revalidate layout (sidebar) if requested
  if (layout) {
    revalidatePath('/notes', 'layout');
    return NextResponse.json({ revalidated: true, type: 'layout', now: Date.now() });
  }

  // Revalidate specific note page
  if (!slug) {
    return NextResponse.json({ message: "Missing slug parameter" }, { status: 400 });
  }

  revalidatePath(`/notes/${slug}`);
  return NextResponse.json({ revalidated: true, type: 'page', slug, now: Date.now() });
}
```

**Triggered After**:
- Note content/title/emoji updates (page revalidation)
- Public note creation/deletion (layout revalidation)

## Performance Optimizations

### 1. React cache() for Deduplication
Eliminates duplicate database queries within the same request:
```typescript
const getNote = cache(async (slug: string) => {
  // Called by both generateMetadata and page render
  // But only executes once per request
});
```

### 2. 24-Hour Layout Caching
Root layout caches public notes for 24 hours, dramatically reducing database load:
```typescript
// app/notes/layout.tsx
export const revalidate = 86400;
```

### 3. Batched Note Updates
Single RPC call for all field updates instead of 3 separate calls:
```typescript
await supabase.rpc("update_note_batched", {
  uuid_arg,
  session_arg,
  title_arg: updates.title || null,
  emoji_arg: updates.emoji || null,
  content_arg: updates.content || null
});
```

### 4. Optimistic Context Updates
Sidebar updates immediately via context instead of refetching:
```typescript
// In note.tsx after save
updateNote(note.id, {
  ...note,
  ...localState,
});
```

### 5. Accumulated Debounce
Rapid edits across fields accumulate instead of cancelling:
```typescript
pendingUpdatesRef.current = {
  ...pendingUpdatesRef.current,
  ...updates,
};
```

### 6. Immediate Blur Saves
Prevents data loss by saving immediately when user leaves input:
```typescript
onBlur={() => saveImmediately()}
```

## API Routes

```
POST /notes/revalidate
├── Purpose: On-demand ISR cache invalidation
├── Auth: Token-based (x-revalidate-token header)
├── Input: { slug?: string, layout?: boolean }
├── Actions:
│   ├── revalidatePath(`/notes/${slug}`) - for specific note
│   └── revalidatePath('/notes', 'layout') - for sidebar/layout
└── Returns: { revalidated: true, type: 'page'|'layout', now: timestamp }

GET /notes/api/og
├── Purpose: Dynamic OG image generation
├── Params: title, emoji (query params)
└── Output: ImageResponse (1200x630px PNG)
```
