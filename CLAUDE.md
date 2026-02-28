# CLAUDE.md

macos desktop environment on the web. next.js, react, tailwind, supabase.

## how to work in this repo

1. read `docs/design-system.md` before touching any UI — it defines colors, tokens, sidebar patterns, and has a checklist for new apps
2. run `npm run build` after making changes — there are no tests, the build is the only gate

everything below exists because agents routinely skip these two steps and ship code that doesn't match the project's conventions.

## design system

**read `docs/design-system.md` before any UI change.** it is the single source of truth for colors, spacing, sidebar patterns, and the new-app checklist.

## key files

| path | purpose |
|------|---------|
| `lib/app-config.ts` | app registry (all apps defined here) |
| `lib/window-context.tsx` | window state machine (open/close/focus/minimize/drag/resize) |
| `lib/sidebar-persistence.ts` | view state persistence + `clearAppState()` |
| `lib/desktop/z-index.ts` | z-index layers: windows 1-50, dock 60, menu bar 70, fullscreen 80, overlays 90-100 |
| `lib/device-detection.ts` | multi-signal mobile detection |
| `components/desktop/` | desktop shell (dock, menu bar, window, notification center) |
| `components/apps/` | all app implementations |

## state persistence

- **sessionStorage** for view state (sidebar selection, scroll position) — clears on tab close
- **localStorage** only for user-created content (calendar events, favorites, message conversations)
- window close clears view state via `clearAppState(appId)` — never add manual clear calls, it's automatic
- minimize preserves state in memory

## window management

- single-window apps: window ID = app ID (`"notes"`)
- multi-window apps (textedit, preview): window ID = `"{appId}-{n}"` (`"textedit-0"`)
- `useWindowManager()` for window operations, `useWindowFocus()` for focus state

## desktop vs mobile

- use `isMobileView` / `isDesktop` prop, never raw viewport queries
- desktop: windowed split view, sidebar 320px + content
- mobile: full-screen navigation, no split view

## menu system

- menus are mutually exclusive via `openMenu` state in `menu-bar.tsx`
- new menu types go in the `OpenMenu` union type in `menu-bar.tsx`
- panel-style menus (battery, wifi, control center, notification center) follow the `status-menus.tsx` pattern
- use `useClickOutside()` from `lib/hooks/use-click-outside.ts` for click-outside dismissal
- file menu actions registered via `FileMenuContext` (register on mount, unregister on unmount)

## data sources

| data | storage | accessed via |
|------|---------|-------------|
| notes | supabase `notes` table | supabase rpc functions |
| photos | supabase `photos` table + storage bucket | `usePhotos()` from `lib/photos/use-photos.ts` |
| calendar events | `localStorage["calendar-user-events"]` + generated sample events | `getEventsForDay()` from `components/apps/calendar/utils.ts` |
| calendar colors | `localStorage["calendar-calendars"]` + defaults | `loadCalendars()` from `components/apps/calendar/data.ts` |
| messages | `localStorage["dialogueConversations"]` + initial data | `data/messages/initial-conversations.ts` |
| photo thumbnails | supabase image transforms | `getThumbnailUrl()` from `lib/photos/image-utils.ts` |

## adding a new app

1. add to `APPS` array in `lib/app-config.ts`
2. create `components/apps/{name}/` with main component
3. add route at `app/(desktop)/{name}/page.tsx`
4. import and render in `components/desktop/desktop.tsx`
5. register in `lib/desktop/app-shell-page.tsx` (desktop + mobile)
6. add persistence + `clearAppState` case in `sidebar-persistence.ts` if the app has view state
7. add escape key handler if the app has text inputs (enables global `q` quit shortcut)
8. run through the full checklist in `docs/design-system.md`

## build

`npm run build` to verify. no test framework; the build is the primary check.
