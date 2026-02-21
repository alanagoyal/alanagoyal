# Application Architecture

This document explains how the app is structured today, with extra focus on:

- how mobile vs desktop rendering works
- what runs on the server vs client
- how routing and URL state work
- how data moves through the major apps

## 1. Mental Model

Think of the project as one Next.js app with two runtime shells:

- `Desktop` shell: macOS-like windows, dock, menu bar
- `MobileShell`: one full-screen app at a time, no desktop chrome

Most routes represent an "app deep link" (`/notes`, `/messages`, `/finder`, etc).  
The shell decides how to present that route depending on device context.

```
HTTP request
  -> Next.js route entry
    -> Shell chooser
      -> Desktop (windowed OS)
      -> MobileShell (single fullscreen app)
```

## 2. High-Level Topology

### UI Layer

- Root layout and global providers: `app/layout.tsx`
- Generic app-entry shell switcher: `lib/desktop/app-shell-page.tsx`
- Desktop shell: `components/desktop/desktop.tsx`
- Mobile shell: `components/mobile/mobile-shell.tsx`

### App Registry + Windowing

- App definitions (IDs, default window sizes, multi-window flags): `lib/app-config.ts`
- Window state machine and persistence: `lib/window-context.tsx`
- Single window container behavior: `components/desktop/window.tsx`

### Data/Backend Surface

- Supabase clients:
  - server: `utils/supabase/server.ts`
  - browser: `utils/supabase/client.ts`
- API routes: `app/api/**` and `app/(desktop)/notes/revalidate/route.ts`

## 3. Routing: What the URL Maps To

Route groups (`app/(desktop)/...`) are organizational only.  
`(desktop)` is not part of the URL path.

Naming note: the `(desktop)` group name is historical. Routes in this group can still render `MobileShell` depending on device detection.

### Core route patterns

- `/` -> `app/page.tsx` -> `HomeClient` -> `AppShellPage`
- `/messages`, `/finder`, `/calendar`, etc. -> route wrapper -> `AppShellPage appId=...`
- `/textedit?file=...` and `/preview?file=...` -> pass file params into `AppShellPage`
- `/notes` -> dedicated server page (`app/(desktop)/notes/page.tsx`)
- `/notes/[slug]` -> dedicated server page with note fetch (`app/(desktop)/notes/[slug]/page.tsx`)

Notes routes are special because they preload note/mobile context on the server.

## 4. Mobile vs Desktop Shell Selection

There are two patterns in the codebase.

### Pattern A: Most routes (client-side shell decision)

Used by `/`, `/messages`, `/finder`, etc.

1. Route renders `AppShellPage`.
2. On first client effect, `window.matchMedia("(pointer: coarse)")` runs.
3. If coarse pointer -> render `MobileShell`.
4. Otherwise -> render `Desktop`.

File: `lib/desktop/app-shell-page.tsx`

### Pattern B: Notes routes (server-preseeded + client-corrected)

Used by `/notes` and `/notes/[slug]`.

1. Server checks headers with `isMobileRequest()` (`sec-ch-ua-mobile`, then user-agent fallback).
2. Server passes `initialIsMobile` to `NotesDesktopPage`.
3. Client still syncs to `matchMedia("(pointer: coarse)")` and listens for changes.
4. If desktop and path is `/notes`, URL normalizes to `/notes/about-me`.

Files:

- `lib/is-mobile-request.ts`
- `app/(desktop)/notes/page.tsx`
- `app/(desktop)/notes/[slug]/page.tsx`
- `app/(desktop)/notes/[slug]/notes-desktop-page.tsx`

Why this exists: notes has slug-sensitive UI and saw more mobile/desktop flicker issues, so it has a stricter handoff.

## 5. Server vs Client Responsibilities

### Server Responsibilities

- HTTP request handling and route entry points
- Metadata generation (`generateMetadata`) and OG image endpoints
- API routes for external integrations and privileged operations
- Initial mobile hint for notes routes
- Initial note fetch for `/notes/[slug]`

Representative files:

- `app/(desktop)/notes/[slug]/page.tsx`
- `app/api/chat/route.ts`
- `app/api/photos/upload/route.ts`
- `app/api/github/route.ts`
- `app/api/preview/pdf/route.ts`

### Client Responsibilities

- Shell rendering (`Desktop` vs `MobileShell`)
- Window interactions (open, focus, drag, resize, maximize, minimize)
- Most app UI and local state
- Local/session persistence
- In-shell URL updates without full router restores

Representative files:

- `components/desktop/desktop.tsx`
- `components/mobile/mobile-shell.tsx`
- `lib/window-context.tsx`
- `components/apps/**`

## 6. URL Strategy Inside the Shell

The app intentionally avoids normal Next navigation for many in-shell transitions.

Utility: `lib/set-url.ts`

- `setUrl(url)`: `replaceState` + custom event
- `pushUrl(url)`: `pushState` + custom event
- Both set history state with `__NA: true`

Reason: avoid Next App Router restore cascades (white-flash/full rerender behavior) when only shell state changed.

Who listens:

- `MobileShell` listens to:
  - browser `popstate`
  - custom `APP_SHELL_URL_CHANGE_EVENT`
- Desktop updates URL from focused window state in an effect.

## 7. Desktop Architecture

`Desktop` composition:

1. `RecentsProvider`
2. `FileMenuProvider`
3. `WindowManagerProvider`
4. `DesktopContent`

File: `components/desktop/desktop.tsx`

### WindowManager behavior

File: `lib/window-context.tsx`

- Loads/restores session state from `sessionStorage` key `desktop-window-state`
- Applies deep-link focus (`initialAppId`) over restored state
- Persists state with debounced writes
- Supports:
  - single-window apps (`notes`, `messages`, etc.)
  - multi-window apps (`textedit`, `preview`) via `instanceId`
- Provides helpers:
  - open/focus/close/minimize/maximize
  - metadata updates for multi-window content
  - restore desktop defaults

### Desktop URL sync

In `DesktopContent`, focused window determines URL:

- notes -> `/notes/{slug}`
- textedit -> `/textedit?file=...`
- preview -> `/preview?file=...`
- others -> `/{appId}`

This keeps sharable URLs aligned with focused context while staying in one client shell.

## 8. Mobile Architecture

`MobileShell` is route-driven and app-fullscreen.

File: `components/mobile/mobile-shell.tsx`

Key behaviors:

- Derives `activeAppId` from `window.location.pathname`
- Derives `activeNoteSlug` from `/notes/{slug}`
- Normalizes `/` to `/notes`
- Responds to history/custom URL change events
- Renders one app at a time (`NotesApp`, `MessagesApp`, etc.)
- Reuses topmost desktop `textedit`/`preview` window metadata from session storage when present

No window frames/dock/menu bar are rendered in this shell.

## 9. Notes Architecture (Detailed)

### Data model

- `notes` table stores both public and private notes
- Private notes are keyed by a per-browser `session_id` in localStorage
- Type: `lib/notes/types.ts`
- Notes are augmented client-side with `display_created_at` for rendered timestamps only (not persisted to DB)

### Entry flow

- `/notes`:
  - desktop -> open notes window, default slug behavior
  - mobile -> sidebar-only list mode
- `/notes/[slug]`:
  - server fetches note via `select_note` RPC
  - mobile receives `initialNote` + slug for faster first render

### Client flow in `NotesApp`

File: `components/apps/notes/notes-app.tsx`

1. Fetch public notes list once.
  - Normalize each note with `withDisplayCreatedAt(...)` so rendering uses a stable display timestamp value.
2. Sync selected note against route slug (`initialSlug`).
3. On selection:
  - update URL immediately
  - optimistically set selected note
  - fetch full note and patch if still current
4. On mobile back-to-list:
  - cancel in-flight sync updates
  - clear selected note
  - set URL to `/notes`

### Editing and persistence

- Session ID initialization: `components/apps/notes/session-id.tsx`
- Session-scoped note list context: `app/(desktop)/notes/session-notes.tsx`
- Save operations from `components/apps/notes/note.tsx`:
  - optimistic local updates
  - batched RPC updates (`update_note_title`, `update_note_content`, etc.)
  - revalidate call to `/notes/revalidate`

### Timestamp display strategy

- Source of truth for render:
  - `display_created_at` (client-computed) when present
  - fallback to DB `created_at`
- Private notes:
  - always use real `created_at`
- Public notes:
  - generate fake, category-consistent display timestamps client-side
  - never allow generated "today" times in the future
  - cache by `day + category + note.id` in session storage (`public-note-display-created-at-v2`)
  - deterministic fallback generation is used when storage APIs are unavailable
- Hydration behavior:
  - timestamp text is rendered after client mount to avoid SSR/client timezone mismatch
  - header and sidebar reserve timestamp width pre-mount to avoid layout shift

## 10. Other Major Data Flows

### Messages

- UI + conversation state in localStorage/session storage (client)
- AI response generation via server route: `app/api/chat/route.ts`
- Contact validation via server route: `app/api/validate-contact/route.ts`
- Mobile/desktop behavior controlled by `isDesktop`/`inShell` props

### Photos

- Browsing UI in client app
- Upload endpoint with service-role Supabase key:
  - `app/api/photos/upload/route.ts`
- Optional AI categorization during upload (OpenAI)

### Finder / iTerm / TextEdit / Preview

- Mostly client-managed UI state
- GitHub file/repo access proxied by `app/api/github/route.ts`
- PDF proxy/safety controls in `app/api/preview/pdf/route.ts`

## 11. Persistence Model

### sessionStorage (per tab/session)

- Window manager state (`desktop-window-state`)
- App sidebar/view state helpers (`lib/sidebar-persistence.ts`)
- Recents and focused conversation pointers
- Public note display timestamp cache (`public-note-display-created-at-v2`)

### localStorage (longer-lived on device)

- Notes browser `session_id`
- Messages conversations and deleted defaults
- System settings (wifi/bluetooth/focus/brightness/os version)
- Music playback state
- Notes pinned set and other app-level user preferences

## 12. End-to-End Lifecycle Examples

### Example A: Desktop user opens `/messages`

1. Route page renders `AppShellPage appId="messages"`.
2. Client detects non-coarse pointer -> renders `Desktop`.
3. `WindowManagerProvider` restores session state and focuses messages app.
4. Desktop window stack renders; URL reflects focused app.

### Example B: Mobile user opens `/notes/about-me`

1. Server fetches note + mobile hint in `/notes/[slug]/page.tsx`.
2. `NotesDesktopPage` receives `initialIsMobile=true` and renders `MobileShell`.
3. `MobileShell` sets active app to notes, active slug to `about-me`.
4. `NotesApp` starts with `initialNote`, then confirms/fills from Supabase.
5. Back action clears selected note and returns URL to `/notes` list view.

## 13. How to Extend the Architecture

When adding a new app:

1. Register it in `lib/app-config.ts`.
2. Add desktop rendering in `components/desktop/desktop.tsx`.
3. Add mobile rendering in `components/mobile/mobile-shell.tsx`.
4. Add route entry page in `app/(desktop)/{app}/page.tsx` (usually via `AppShellPage`).
5. If you need server-prefetched data for first paint, follow the notes pattern:
   dedicated server page -> pass initial props -> client shell component.

## 14. Current Tradeoffs (Important)

- Device detection is heuristic-based (`pointer: coarse` and headers), so hybrid devices can still hit edge cases.
- Most routes still choose shell client-side; notes is the more robust server-preseeded path.
- URL updates intentionally bypass normal Next navigation for shell smoothness, so state is shell-driven first, router-driven second.

These tradeoffs are deliberate for a desktop-OS UX that feels immediate and avoids full-route flashes.

## 15. Inconsistencies and Design Debt to Address

This section captures issues that are currently workable but should be cleaned up to reduce bugs and maintenance cost.

### 15.1 Shell selection is inconsistent across routes (high)

Current state:

- Most app routes pick shell client-side in `lib/desktop/app-shell-page.tsx`.
- Notes routes use server-seeded detection + client correction in `app/(desktop)/notes/page.tsx` and `app/(desktop)/notes/[slug]/notes-desktop-page.tsx`.

Why this is a problem:

- Different first-render behavior depending on route.
- More flicker/blank-first-paint risk on routes that only decide shell on the client.

Recommended direction:

- Standardize on one shell-resolution flow for all app-entry routes.
- Prefer server-seeded initial shell (`initialIsMobile`) with client correction.

### 15.2 Device detection is fragmented (high)

Current state:

- Server helper: `lib/is-mobile-request.ts`
- Client checks: direct `matchMedia("(pointer: coarse)")` calls
- Separate hook: `components/apps/notes/mobile-detector.tsx`

Why this is a problem:

- Divergent behavior across surfaces.
- Hybrid devices can resolve differently in different parts of the app.

Recommended direction:

- Introduce a shared device-resolution module with one policy and one fallback chain.
- Keep all shell-level detection behind that module.

### 15.3 Navigation layer is split between multiple paradigms (high)

Current state:

- Custom history utilities: `lib/set-url.ts`
- Native Next navigation in some places (`router.push`, route renders)
- Desktop-side URL rewriting from focused window in `components/desktop/desktop.tsx`

Why this is a problem:

- URL ownership is not centralized.
- Harder to reason about back/forward behavior and history stack semantics.

Recommended direction:

- Add a single "URL coordinator" abstraction that defines:
  - who owns URL writes
  - when to `push` vs `replace`
  - which transitions must go through Next navigation vs shell-only history

### 15.4 Request-scoped APIs in static build paths (resolved, keep as guardrail)

Current state:

- `app/(desktop)/notes/[slug]/page.tsx` now uses a request-free Supabase client in `generateStaticParams`.
- Request-scoped Supabase access (`createServerClient`, which reads `cookies()`) is kept in request-bound paths only (`getNote`, page render, metadata).

Why this matters:

- `generateStaticParams` can run outside request scope.
- Calling request-scoped APIs there (directly or indirectly via `cookies()`/`headers()`) causes runtime/build errors.

Guardrail:

- Never use request-scoped helpers inside static generation functions.
- For static params, use request-free clients/config only.

### 15.5 Deep-link conventions are inconsistent by app (medium)

Current state:

- Notes: path-based (`/notes/[slug]`)
- Messages: query-based conversation ID (`/messages?id=...`)
- TextEdit/Preview: query-based file paths

Why this is a problem:

- No uniform rule for canonical URLs.
- Makes cross-app routing patterns harder to extend and document.

Recommended direction:

- Define route conventions explicitly:
  - path params for canonical resources
  - query params for transient view state only
- Migrate high-value routes to consistent canonical formats over time.

### 15.6 Persistence boundaries are not fully standardized (medium)

Current state:

- Data is spread across `sessionStorage` and `localStorage` with app-specific rules.
- This is pragmatic, but policy is mostly implicit.

Why this is a problem:

- Similar data types use different lifetimes depending on app.
- Harder to predict behavior after refresh, tab-close, or returning sessions.

Recommended direction:

- Add a storage policy matrix (key -> owner -> lifetime -> reset condition).
- Enforce naming and lifecycle conventions in one utility layer.

### 15.7 Naming drift: `(desktop)` route group now serves mobile too (low)

Current state:

- Route group is named `(desktop)`, but many entries branch into `MobileShell`.

Why this is a problem:

- New contributors may infer incorrect routing intent.

Recommended direction:

- Consider renaming route group to something neutral (for example `(shell)`), or document this convention near route definitions.
