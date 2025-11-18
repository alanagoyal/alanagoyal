---
name: add-server-vs-client-component
description: This skill helps you decide whether to create a Server Component or Client Component, and how to implement each correctly in this Next.js 14 App Router application.
---

## When to Use This Skill

- Adding a new component to the application
- Unsure whether to use Server or Client Component
- Getting hydration errors or "use client" directive issues
- Need to fetch data from Supabase

## Repository Context

This app uses Next.js 14 App Router with a **server-first** approach:
- **Default**: All components are Server Components (no "use client")
- **Explicit opt-in**: Client Components require `"use client"` directive

## Decision Matrix

### Use **Server Component** when:

✅ Fetching data from Supabase database
✅ Need SEO/metadata (generateMetadata only works in Server Components)
✅ Want to reduce client-side JavaScript bundle
✅ Just rendering content (no interactivity)
✅ Want ISR caching for performance

**Examples in this codebase**:
- `/workspace/repo/app/notes/layout.tsx` - Fetches public notes
- `/workspace/repo/app/notes/[slug]/page.tsx` - Fetches individual note with ISR
- `/workspace/repo/components/sidebar-content.tsx` - Renders note list (server-compatible)

### Use **Client Component** when:

✅ Need React hooks (useState, useEffect, useContext, etc.)
✅ Event handlers (onClick, onChange, onKeyDown)
✅ Browser APIs (localStorage, window, document)
✅ Third-party libraries that require browser environment
✅ Real-time user interaction (editing, search, keyboard shortcuts)

**Examples in this codebase**:
- `/workspace/repo/components/sidebar.tsx` - Keyboard navigation, search
- `/workspace/repo/components/note.tsx` - Note editor with auto-save
- `/workspace/repo/components/session-id.tsx` - localStorage access
- `/workspace/repo/components/command-menu.tsx` - Command palette (Cmd+K)

## Implementation Patterns

### Pattern 1: Server Component (Default)

**No "use client" directive needed**

```typescript
// /workspace/repo/app/notes/example/page.tsx
import { createClient } from "@/utils/supabase/server";

export default async function ExamplePage() {
  // ✅ Can use async/await directly in component
  const supabase = createClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);

  return (
    <div>
      {notes.map(note => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  );
}
```

**Key Features**:
- Can use `async` component function
- Direct database queries
- No hooks (useState, useEffect)
- No event handlers
- Rendered on server (better SEO)

### Pattern 2: Client Component (Explicit)

**Requires "use client" directive at the top**

```typescript
// /workspace/repo/components/example-component.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ExampleComponent({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const supabase = createClient();

  const handleClick = async () => {
    const { data: newData } = await supabase
      .from("notes")
      .select("*");
    setData(newData);
  };

  return (
    <div>
      <button onClick={handleClick}>Fetch Data</button>
      {/* Render data */}
    </div>
  );
}
```

**Key Features**:
- Must start with `"use client";`
- Can use React hooks
- Event handlers allowed
- Browser APIs accessible
- Rendered on client (after hydration)

### Pattern 3: Server → Client Boundary (Recommended)

**Fetch data in Server Component, pass to Client Component**

```typescript
// /workspace/repo/app/notes/example/page.tsx (Server Component)
import { createClient } from "@/utils/supabase/server";
import ExampleClient from "@/components/example-client";

export default async function ExamplePage() {
  // Fetch in Server Component
  const supabase = createClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);

  // Pass to Client Component
  return <ExampleClient notes={notes} />;
}
```

```typescript
// /workspace/repo/components/example-client.tsx (Client Component)
"use client";

import { useState } from "react";

export default function ExampleClient({ notes }: { notes: any[] }) {
  const [selectedNote, setSelectedNote] = useState(notes[0]);

  return (
    <div>
      {notes.map(note => (
        <button
          key={note.id}
          onClick={() => setSelectedNote(note)}
        >
          {note.title}
        </button>
      ))}
    </div>
  );
}
```

**Benefits**:
- Initial data is SSR'd (no loading state)
- Reduces client-side data fetching
- Better performance and SEO
- Client component handles interactivity

**Real Example**: `/workspace/repo/app/notes/layout.tsx` (Server) → `/workspace/repo/components/sidebar-layout.tsx` (Client)

### Pattern 4: Using React cache() in Server Components

**Eliminate duplicate fetches between metadata and page render**

```typescript
// /workspace/repo/app/notes/[slug]/page.tsx
import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

// Cached function (deduplicates requests)
const getNote = cache(async (slug: string) => {
  const supabase = createClient();
  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single();
  return note;
});

// generateMetadata calls getNote
export async function generateMetadata({ params }) {
  const note = await getNote(params.slug);
  return {
    title: note.title,
  };
}

// Page render also calls getNote (shares cache)
export default async function NotePage({ params }) {
  const note = await getNote(params.slug);
  return <div>{note.content}</div>;
}
```

**Why**: React cache() ensures getNote is only called once per request, even though it's used in both metadata and render.

## Supabase Client Usage

### ⚠️ CRITICAL: Use correct client for component type

**Server Components**:
```typescript
import { createClient } from "@/utils/supabase/server";

export default async function ServerComponent() {
  const supabase = createClient();
  // Use for database queries
}
```

**Client Components**:
```typescript
"use client";
import { createClient } from "@/utils/supabase/client";

export default function ClientComponent() {
  const supabase = createClient();
  // Use for database queries
}
```

**Why the difference?**
- Server client uses Next.js cookies (SSR-compatible)
- Browser client uses localStorage/cookies (browser-only)
- Using wrong client causes runtime errors

## Common Patterns in This Codebase

### Layout Pattern (Server Component)
```typescript
// /workspace/repo/app/notes/layout.tsx
export const revalidate = 86400; // ISR cache (24 hours)

export default async function RootLayout({ children }) {
  const supabase = createClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);

  return (
    <ThemeProvider>
      <SidebarLayout notes={notes}>
        {children}
      </SidebarLayout>
    </ThemeProvider>
  );
}
```
- Fetches public notes with ISR
- Passes to Client Component (SidebarLayout)

### Dynamic Page Pattern (Server Component + ISR)
```typescript
// /workspace/repo/app/notes/[slug]/page.tsx
export const revalidate = 86400;
export const dynamicParams = true;

export default async function NotePage({ params }) {
  const note = await getNote(params.slug);

  return <Note note={note} />;
}
```
- Fetches note with ISR caching
- Renders Client Component for editing

### Editor Pattern (Client Component)
```typescript
// /workspace/repo/components/note.tsx
"use client";

import { useState, useCallback, useRef } from "react";

export default function Note({ note: initialNote }) {
  const [note, setNote] = useState(initialNote);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveNote = useCallback((updates: Partial<Note>) => {
    // Optimistic update
    setNote(prev => ({ ...prev, ...updates }));

    // Debounced save
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await supabase.rpc("update_note_content", { ... });
    }, 500);
  }, []);

  return (
    <div>
      <textarea
        value={note.content}
        onChange={(e) => saveNote({ content: e.target.value })}
      />
    </div>
  );
}
```
- Manages local state (note content)
- Debounced auto-save
- Event handlers for user input

### Context Provider Pattern (Client Component)
```typescript
// /workspace/repo/app/notes/session-notes.tsx
"use client";

import { createContext, useState, useCallback } from "react";

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
  }, [sessionId]);

  return (
    <SessionNotesContext.Provider value={{ sessionId, notes, setSessionId, refreshSessionNotes }}>
      {children}
    </SessionNotesContext.Provider>
  );
}
```
- Provides session data to all child components
- Manages session notes state

## Common Mistakes & Solutions

### ❌ Mistake 1: Using hooks in Server Component
```typescript
// BAD: No "use client" directive
import { useState } from "react";

export default function Component() {
  const [state, setState] = useState(); // Error!
  return <div>...</div>;
}
```

**✅ Solution**: Add "use client" directive
```typescript
"use client";
import { useState } from "react";

export default function Component() {
  const [state, setState] = useState();
  return <div>...</div>;
}
```

### ❌ Mistake 2: Using server client in Client Component
```typescript
// BAD: Server client in Client Component
"use client";
import { createClient } from "@/utils/supabase/server";

export default function Component() {
  const supabase = createClient(); // Error!
}
```

**✅ Solution**: Use browser client
```typescript
"use client";
import { createClient } from "@/utils/supabase/client";

export default function Component() {
  const supabase = createClient();
}
```

### ❌ Mistake 3: Accessing localStorage in Server Component
```typescript
// BAD: No "use client" directive
export default function Component() {
  const sessionId = localStorage.getItem("session_id"); // Error!
}
```

**✅ Solution**: Create Client Component wrapper
```typescript
"use client";
import { useEffect } from "react";

export default function Component() {
  useEffect(() => {
    const sessionId = localStorage.getItem("session_id");
  }, []);
}
```

### ❌ Mistake 4: Passing functions as props across Server → Client boundary
```typescript
// BAD: Functions not serializable
export default async function ServerComponent() {
  const handleClick = () => console.log("click");

  return <ClientComponent onClick={handleClick} />; // Error!
}
```

**✅ Solution**: Define function in Client Component
```typescript
// Server Component
export default async function ServerComponent() {
  return <ClientComponent />;
}

// Client Component
"use client";
export default function ClientComponent() {
  const handleClick = () => console.log("click");

  return <button onClick={handleClick}>Click</button>;
}
```

## Checklist for New Components

**Before creating a component, ask**:

1. ⬜ Does it need React hooks? → Client Component
2. ⬜ Does it have event handlers? → Client Component
3. ⬜ Does it access browser APIs? → Client Component
4. ⬜ Does it fetch data from Supabase? → Server Component (preferred)
5. ⬜ Does it need ISR caching? → Server Component
6. ⬜ Can I fetch data in parent Server Component and pass as props? → Do this!

**After creating, verify**:

1. ⬜ Server Component: No "use client" directive
2. ⬜ Client Component: Has "use client" directive at top
3. ⬜ Using correct Supabase client (`@/utils/supabase/server` vs `client`)
4. ⬜ Props passed from Server → Client are JSON-serializable
5. ⬜ No hydration errors when running `npm run dev`

## Related Files

- Server Supabase client: `/workspace/repo/utils/supabase/server.ts`
- Browser Supabase client: `/workspace/repo/utils/supabase/client.ts`
- Layout example (Server): `/workspace/repo/app/notes/layout.tsx`
- Page example (Server + ISR): `/workspace/repo/app/notes/[slug]/page.tsx`
- Editor example (Client): `/workspace/repo/components/note.tsx`
- Sidebar example (Client): `/workspace/repo/components/sidebar.tsx`
- Context provider (Client): `/workspace/repo/app/notes/session-notes.tsx`

## Additional Resources

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- Repository architecture: `/workspace/repo/ARCHITECTURE.md`
