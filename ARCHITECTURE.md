# Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Component Structure](#component-structure)
5. [Data Flow](#data-flow)
6. [Session Management](#session-management)
7. [Note Creation Flow](#note-creation-flow)
8. [ISR & Revalidation Strategy](#isr--revalidation-strategy)
9. [Performance Bottlenecks](#performance-bottlenecks)
10. [Proposed Improvements](#proposed-improvements)

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
- 7 custom RPC functions for data operations

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

### API Routes

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

#### `components/sidebar.tsx` (Client)
- **Purpose**: Main sidebar with note list, search, keyboard shortcuts
- **State Management**: 10+ state variables (complex)
- **Dependencies**: Context for session notes, public notes from props
- **Features**:
  - Keyboard navigation (j/k, arrow keys)
  - Pin/unpin notes (localStorage)
  - Delete notes (RPC call)
  - Search with live results
  - Theme toggle (t key)
  - Command palette (Cmd+K)
- **Issue**: High complexity, many useEffect hooks, large component

#### `components/note.tsx` (Client)
- **Purpose**: Note editor with auto-save
- **Debouncing**: 500ms delay before saving changes
- **Granular Updates**: Separate RPC calls for title, emoji, content
- **Revalidation**: Calls `/notes/revalidate` after each save
- **Issue**: 3 separate RPC calls per save, redundant revalidation

#### `app/notes/session-notes.tsx` (Client Context)
- **Purpose**: Provides session notes to all components
- **Data Fetching**: Calls `select_session_notes` RPC
- **Refresh Mechanism**: `refreshSessionNotes()` called after mutations
- **Issue**: Causes full note list refetch on every change

## Data Flow

### Initial Page Load (Public Note)

```
1. User visits /notes/about-me
   │
2. app/notes/layout.tsx (Server)
   ├── Fetches all public notes from Supabase (cached 24 hours)
   │   └── supabase.from("notes").select("*").eq("public", true)
   │
3. app/notes/[slug]/page.tsx (Server)
   ├── getNote(slug) - Cached function using React cache()
   ├── generateMetadata(): await getNote(slug)
   ├── NotePage render: await getNote(slug) [shares cache]
   │
4. Client Hydration
   ├── SidebarLayout mounts
   │   ├── SessionNotesProvider mounts
   │   │   ├── SessionId generates/retrieves UUID from localStorage
   │   │   ├── setSessionId triggers useEffect
   │   │   └── refreshSessionNotes() calls select_session_notes RPC
   │   │
   │   └── Sidebar mounts
   │       ├── Combines publicNotes + sessionNotes
   │       ├── Loads pinnedNotes from localStorage
   │       ├── Groups notes by category
   │       └── Sets up keyboard event listeners
   │
   └── Note component mounts
       ├── Receives note data from server
       ├── SessionId sets sessionId state
       └── Renders NoteHeader + NoteContent
```

**Data Fetch Count**: 3 queries
1. Layout: All public notes (cached 24 hours)
2. getNote: select_note (slug) - shared between metadata and render
3. SessionNotesProvider: select_session_notes (session_id)

### Note Edit Flow

```
1. User types in note editor
   │
2. NoteContent onChange fires
   ├── Calls saveNote({ content: newContent })
   │
3. saveNote function (debounced 500ms)
   ├── Clears previous timeout
   ├── Updates local state immediately (optimistic update)
   ├── After 500ms:
   │   ├── supabase.rpc("update_note_content", { uuid, session, content })
   │   ├── fetch("/notes/revalidate", { slug })
   │   ├── refreshSessionNotes() - refetches ALL session notes
   │   └── router.refresh() - refetches server components
   │
4. SessionNotesProvider.refreshSessionNotes()
   ├── supabase.rpc("select_session_notes", { session_id })
   └── Updates context with full note list
   │
5. Router.refresh()
   ├── Re-executes layout.tsx (fetches all public notes again)
   └── Re-executes [slug]/page.tsx if ISR cache is stale
```

**Data Fetch Count per Edit**: 2-4 queries
1. update_note_content RPC (write)
2. select_session_notes RPC (read all session notes)
3. Layout refresh: All public notes (if router.refresh executes)
4. Page refresh: select_note (if ISR cache is invalidated)

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
4. Post-creation flow (Desktop)
   ├── addNewPinnedNote(slug) - adds to localStorage
   ├── refreshSessionNotes()
   │   └── Fetches all session notes from DB
   ├── setSelectedNoteSlug(slug)
   ├── router.push(`/notes/${slug}`)
   └── router.refresh()
   │
5. Post-creation flow (Mobile)
   ├── addNewPinnedNote(slug)
   ├── router.push(`/notes/${slug}`)
   └── .then(() => {
       ├── refreshSessionNotes()
       └── setSelectedNoteSlug(slug)
   })
   │
6. Toast notification: "Private note created"
```

**Data Fetch Count**: 2 queries
1. Insert note (write)
2. select_session_notes (read all session notes)

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

**Data Fetch Count**: 2 queries
1. delete_note RPC (write)
2. select_session_notes (read all session notes)

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
});
```

**Context Values**:
- `sessionId`: Current user's session UUID
- `notes`: Array of notes belonging to this session
- `setSessionId`: Function to update session ID
- `refreshSessionNotes`: Async function to refetch session notes

**Provider Location**: Wraps entire app in `sidebar-layout.tsx`

**Data Fetching**:
```typescript
const refreshSessionNotes = useCallback(async () => {
  if (sessionId) {
    const notes = await getSessionNotes({ supabase, sessionId });
    setNotes(notes || []);
  }
}, [supabase, sessionId]);
```

**Automatic Refresh**: useEffect triggers when sessionId changes

### Authentication & Security

**No Traditional Auth**: The app doesn't use Supabase Auth (email/password)

**Session-Based Security**:
- Each note has a `session_id` field
- RPC functions verify session ownership before updates/deletes
- Row Level Security (RLS) policies enforce access control

**RPC Function Security Example**:
```sql
CREATE OR REPLACE FUNCTION update_note_content(
  uuid_arg UUID,
  session_arg UUID,
  content_arg TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE notes
  SET content = content_arg
  WHERE id = uuid_arg AND session_id = session_arg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Security Model**:
- Public notes (`public = true`): Anyone can view
- Private notes (`public = false`): Only session owner can view/edit
- Updates/deletes: Require matching `session_id`
- No cross-session access possible

## Note Creation Flow

### Entry Points

1. **New Note Button** (`components/new-note.tsx`)
   - Keyboard shortcut: `N` key (not Cmd/Ctrl+N)
   - Visible in sidebar navigation

2. **Command Menu** (`components/command-menu.tsx`)
   - Keyboard shortcut: `Cmd/Ctrl+K`, then type "new note"
   - Displays all available commands

### Creation Function

```typescript
// lib/create-note.ts
export async function createNote(
  sessionId: string | null,
  router: any,
  addNewPinnedNote: (slug: string) => void,
  refreshSessionNotes: () => Promise<void>,
  setSelectedNoteSlug: (slug: string | null) => void,
  isMobile: boolean
)
```

**Steps**:
1. Generate unique IDs
   - `noteId = uuidv4()`
   - `slug = "new-note-{noteId}"`

2. Create note object
   ```typescript
   {
     id: noteId,
     slug: slug,
     title: "",
     content: "",
     public: false,
     created_at: new Date().toISOString(),
     session_id: sessionId,
     category: "today",
     emoji: "👋🏼"
   }
   ```

3. Insert to database
   - `supabase.from("notes").insert(note)`

4. Post-creation actions
   - Add to pinned notes in localStorage
   - Refresh session notes from DB
   - Navigate to new note
   - Refresh router (server components)
   - Show toast notification

### Desktop vs Mobile Behavior

**Desktop** (sequential):
```typescript
refreshSessionNotes().then(() => {
  setSelectedNoteSlug(slug);
  router.push(`/notes/${slug}`);
  router.refresh();
});
```

**Mobile** (navigate first):
```typescript
router.push(`/notes/${slug}`).then(() => {
  refreshSessionNotes();
  setSelectedNoteSlug(slug);
});
```

**Reasoning**: On mobile, show the note immediately for better perceived performance.

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

### generateStaticParams

```typescript
export async function generateStaticParams() {
  const supabase = createBrowserClient();
  const { data: posts } = await supabase
    .from("notes")
    .select("slug")
    .eq("public", true);

  return posts!.map(({ slug }) => ({ slug }));
}
```

**Purpose**: Pre-render all public notes at build time for optimal performance.

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
    return NextResponse.json({
      revalidated: true,
      type: 'layout',
      now: Date.now()
    });
  }

  // Revalidate specific note page
  if (!slug) {
    return NextResponse.json({ message: "Missing slug parameter" }, { status: 400 });
  }

  revalidatePath(`/notes/${slug}`);
  return NextResponse.json({
    revalidated: true,
    type: 'page',
    slug,
    now: Date.now()
  });
}
```

**Triggered After**:
- Note content updates
- Note title updates
- Note emoji updates
- Public note creation/deletion (layout revalidation)

**Called From**:
```typescript
// components/note.tsx - Revalidate specific note
await fetch("/notes/revalidate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
  },
  body: JSON.stringify({ slug: note.slug }),
});

// Revalidate layout/sidebar when public notes change
await fetch("/notes/revalidate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
  },
  body: JSON.stringify({ layout: true }),
});
```

### Layout Revalidation

**Configuration** (`app/notes/layout.tsx`):
```typescript
export const revalidate = 86400; // 24 hours
```

**Impact**: Root layout is cached for 24 hours, reducing database load.

**Reasoning**: For a personal site with infrequent public note changes, 24-hour cache is acceptable.

**Manual Revalidation**: Use the revalidation API when adding/removing public notes:
```bash
curl -X POST "https://yourdomain.com/notes/revalidate" \
  -H "Content-Type: application/json" \
  -H "x-revalidate-token: your-token" \
  -d '{"layout": true}'
```

## Performance Bottlenecks

### Recent Improvements

**Implemented optimizations**:
1. **Eliminated duplicate note fetches** - Using React `cache()` to deduplicate
2. **Fixed server client usage** - Layout now uses proper server-side client
3. **Added layout caching** - Changed from `revalidate = 0` to `revalidate = 86400`
4. **Enhanced revalidation API** - Added layout revalidation support

**Performance Results**:
- 25% reduction in queries per page load (from 4 to 3)
- 99%+ reduction in layout queries (cached 24 hours instead of every request)
- 50% reduction in note page queries (eliminated duplicate fetch)

---

### Historical Issues (Resolved)

#### 1. Duplicate Data Fetching in Note Pages (Resolved)

**Location**: `app/notes/[slug]/page.tsx`

**Previous Issue**: The same note was fetched twice on every page load:

```typescript
// First fetch - generateMetadata
export async function generateMetadata({ params }) {
  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single();
  // ... use note for metadata
}

// Second fetch - NotePage render
export default async function NotePage({ params }) {
  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single();
  // ... render note
}
```

**Impact**:
- 2x database queries for every note page load
- Increased latency (sequential queries)
- Wasted database resources

**Why It Happened**: Next.js executes `generateMetadata` and page render separately, and they don't share cache by default.

**Solution Implemented**:
```typescript
import { cache } from "react";

const getNote = cache(async (slug: string) => {
  const supabase = createServerClient();
  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single();
  return note;
});

// Both generateMetadata and NotePage now use getNote(slug)
// React cache() ensures only one fetch happens per request
```

---

#### 2. Root Layout Fetching on Every Request (Resolved)

**Location**: `app/notes/layout.tsx`

**Previous Issue**:
```typescript
export const revalidate = 0;

export default async function RootLayout({ children }) {
  const supabase = createBrowserClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);
  // ... pass to SidebarLayout
}
```

**Impact**:
- Database query on every navigation
- No caching benefits from ISR
- High load on Supabase for popular sites
- Slow page transitions

**Why It Was Done**: To ensure sidebar always shows latest public notes.

**Solution Implemented**:
```typescript
import { createClient } from "@/utils/supabase/server";

export const revalidate = 86400; // 24 hour cache

export default async function RootLayout({ children }) {
  const supabase = createClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);
  // ...
}
```

---

### Current Bottlenecks

#### 1. Excessive Refetching After Note Updates

**Location**: `components/note.tsx`

**Issue**: After every note save (debounced 500ms), the app triggers:

```typescript
// 1. Update RPC call
await supabase.rpc("update_note_content", { ... });

// 2. Revalidate ISR cache
await fetch("/notes/revalidate", { slug });

// 3. Refetch ALL session notes
refreshSessionNotes();

// 4. Refresh ALL server components
router.refresh();
```

**Impact**:
- `refreshSessionNotes()` refetches entire note list (unnecessary)
- `router.refresh()` re-executes layout (fetches all public notes again)
- Multiple queries for single change
- Choppy editing experience if debounce fails

**Why It's Done**: To keep sidebar in sync with database changes.

**Better Approach**:
- Optimistic updates for sidebar
- Only refetch on navigation, not on every save
- Use Supabase real-time subscriptions for live updates

#### 2. Three Separate RPC Calls for Note Updates

**Location**: `components/note.tsx`

**Issue**: Each field update triggers separate RPC call:

```typescript
if ('title' in updates) {
  await supabase.rpc("update_note_title", { uuid_arg, session_arg, title_arg });
}
if ('emoji' in updates) {
  await supabase.rpc("update_note_emoji", { uuid_arg, session_arg, emoji_arg });
}
if ('content' in updates) {
  await supabase.rpc("update_note_content", { uuid_arg, session_arg, content_arg });
}
```

**Impact**:
- 1-3 separate database queries per save
- Sequential execution (not parallel)
- Higher latency for multi-field updates
- More complex RPC function management

**Why It's Done**: Granular control over what gets updated.

**Better Approach**: Single `update_note` RPC that accepts optional fields:
```typescript
await supabase.rpc("update_note", {
  uuid_arg,
  session_arg,
  title_arg: updates.title,
  emoji_arg: updates.emoji,
  content_arg: updates.content
});
```

#### 3. Complex Sidebar with 10+ State Variables

**Location**: `components/sidebar.tsx`

**Issue**: The Sidebar component manages:
- `selectedNoteSlug`
- `pinnedNotes`
- `groupedNotes`
- `localSearchResults`
- `highlightedIndex`
- `openSwipeItemSlug`
- `highlightedNote`
- `searchQuery`
- `isScrolled`
- `selectedNote`

**Impact**:
- High component complexity (493 lines)
- Multiple useEffect hooks (6+)
- Difficult to maintain and test
- Potential for unnecessary re-renders

**Why It's Done**: All sidebar functionality is in one component.

**Better Approach**:
- Split into smaller components with focused responsibilities
- Extract custom hooks for keyboard navigation, search, note grouping
- Use React.memo to prevent unnecessary re-renders

#### 4. Debounce Implementation Can Drop Edits

**Location**: `components/note.tsx`

**Issue**: If user navigates away or closes tab within 500ms window:

```typescript
saveTimeoutRef.current = setTimeout(async () => {
  // ... save logic
}, 500);
```

**Impact**:
- Lost edits if user navigates quickly
- No visual feedback that save is pending
- No error handling for failed saves

**Better Approach**:
- Save immediately on blur/unmount
- Show "saving..." indicator
- Implement retry logic for failed saves
- Use beforeunload event to prevent data loss

#### 5. Keyboard Event Listeners Not Cleaned Up Properly

**Location**: `components/sidebar.tsx`

**Issue**: Large useEffect with keyboard handlers:

```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // ... 100+ lines of keyboard logic
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [navigateNotes, highlightedNote, handlePinToggle, /* ...10+ dependencies */]);
```

**Impact**:
- Effect re-runs whenever any dependency changes
- Removes and re-adds event listener frequently
- Potential memory leaks if cleanup fails
- Hard to debug keyboard issues

**Better Approach**:
- Use a custom hook for keyboard shortcuts
- Memoize handler functions to reduce re-runs
- Use refs for values that don't need to trigger re-renders

#### 6. Search Runs on Every Keystroke

**Location**: `components/search.tsx`

**Issue**: Search filter runs immediately on input change (assumption based on typical implementation).

**Impact**:
- Filtering entire note list on every keystroke
- Potential performance issues with large note collections
- High CPU usage during typing

**Better Approach**:
- Debounce search input (200-300ms)
- Use virtual scrolling for large result sets
- Implement fuzzy search with indexed lookups

#### 7. Large Bundle Size from UI Components

**Issue**: App imports many Radix UI components and other libraries:
- Command menu (`cmdk`)
- Emoji picker (`@emoji-mart/react`, `@emoji-mart/data`)
- Multiple Radix UI primitives
- Full Lucide icon set

**Impact**:
- Large initial bundle size
- Slower First Contentful Paint (FCP)
- Wasted bandwidth for unused components

**Better Approach**:
- Lazy load command menu (only when Cmd+K pressed)
- Lazy load emoji picker (only when emoji button clicked)
- Use tree-shakeable icon imports
- Consider code splitting by route
