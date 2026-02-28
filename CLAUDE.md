# CLAUDE.md

macos desktop environment on the web. next.js, react, tailwind, supabase.

## how to work in this repo

1. read `docs/design-system.md` before touching any UI — it defines colors, tokens, sidebar patterns, and has a checklist for new apps
2. run `npm run build` after making changes — no test framework, the build is the only gate

## key files

| path | purpose |
|------|---------|
| `lib/app-config.ts` | app registry (all apps defined here) |
| `lib/window-context.tsx` | window state machine (open/close/focus/minimize/drag/resize) |
| `lib/sidebar-persistence.ts` | view state persistence + `clearAppState()` |
| `lib/desktop/z-index.ts` | z-index layers: windows 1-50, dock 60, menu bar 70, fullscreen 80, overlays 90-100 |
| `components/desktop/` | desktop shell (dock, menu bar, window, notification center) |
| `components/apps/` | all app implementations |

## conventions

- **state persistence**: sessionStorage for view state, localStorage only for user-created content. window close clears view state via `clearAppState()` automatically
- **window management**: `useWindowManager()` for operations, `useWindowFocus()` for focus state
- **desktop vs mobile**: use `isMobileView` / `isDesktop` prop, never raw viewport queries
- **menu system**: menus are mutually exclusive via `openMenu` state in `menu-bar.tsx`. panel-style menus follow the `status-menus.tsx` pattern. use `useClickOutside()` for dismissal

