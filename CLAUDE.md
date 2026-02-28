# CLAUDE.md

macOS desktop environment recreated on the web. Next.js, React, Tailwind, Supabase. Ten working apps with window management, dock, menu bar, and notification center.

## Design System (mandatory)

**Read `docs/design-system.md` before any UI change.** It is the source of truth. Key rules:

- Semantic color tokens only: `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-muted`, `border-muted-foreground/20`
- Accent blue is `#0A7CFF` — never `bg-blue-500` or Tailwind color shorthands
- Icons: `text-muted-foreground` or `text-foreground`, never hardcoded grays
- No hover states on sidebar items; selected state is `bg-[#0A7CFF] text-white` on desktop only
- `<ScrollArea>` component for scrollable content, not `overflow-y-auto`
- Nav bars need `select-none`; buttons inside draggable areas need `onMouseDown={(e) => e.stopPropagation()}`
- Follow the "Checklist for New Apps" at the bottom of the design system doc

## Key Files

| File | Purpose |
|------|---------|
| `lib/app-config.ts` | App registry — all apps defined here |
| `lib/window-context.tsx` | Window state machine (open/close/focus/minimize/drag/resize) |
| `lib/sidebar-persistence.ts` | View state persistence patterns + `clearAppState()` |
| `lib/desktop/z-index.ts` | Z-index layers: windows 1-50, dock 60, menu bar 70, fullscreen 80, overlays 90-100 |
| `lib/device-detection.ts` | Multi-signal mobile detection (requires 3+ signals) |
| `components/desktop/` | Desktop shell (dock, menu bar, window, notification center) |
| `components/apps/` | All app implementations |

## State Persistence

- **sessionStorage** for view state (sidebar selection, scroll position, window positions) — clears on tab close
- **localStorage** only for user-created content (calendar events, favorites, contacts)
- Window close clears view state via `clearAppState(appId)` in `sidebar-persistence.ts` — never add manual clear calls in nav bars, it's automatic
- Minimize preserves state in memory

## Window Management

- Single-window apps: window ID = app ID (`"notes"`)
- Multi-window apps (textedit, preview): window ID = `"{appId}-{n}"` (`"textedit-0"`)
- Use `useWindowManager()` for window operations, `useWindowFocus()` for focus state

## Desktop vs Mobile

- Use `isMobileView` / `isDesktop` prop — never raw viewport queries
- Desktop: windowed split view, sidebar 320px + content
- Mobile: full-screen navigation, no split view
- Some apps redirect on mobile (textedit → finder, preview → finder)

## Adding a New App

1. Add to `APPS` array in `lib/app-config.ts`
2. Create `components/apps/{name}/` with main component
3. Add route at `app/(desktop)/{name}/page.tsx`
4. Import and render in `components/desktop/desktop.tsx`
5. Register in `lib/desktop/app-shell-page.tsx` (desktop + mobile)
6. Add persistence + `clearAppState` case in `sidebar-persistence.ts` if the app has view state
7. Add Escape key handler if the app has text inputs (enables global `q` quit shortcut)
8. Run through the full checklist in `docs/design-system.md`

## Menu System

- Menus are mutually exclusive via `openMenu` state in `menu-bar.tsx`
- New menu types go in the `OpenMenu` union type
- File menu actions registered via `FileMenuContext` (register on mount, unregister on unmount)
- Panel-style menus follow the `status-menus.tsx` pattern

## Build

Run `npm run build` to verify changes compile. No test framework is configured; the build is the primary check.
