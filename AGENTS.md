# AGENTS.md

macos desktop environment on the web. next.js, react, tailwind, supabase.

this file captures the patterns and conventions that matter most when working in this codebase. it should grow as new patterns emerge and stay trimmed as old ones become obvious.

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

## living docs

read before building, update when you ship:

| file | update when |
|------|-------------|
| `AGENTS.md` | new patterns or conventions emerge |
| `docs/design-system.md` | new UI components or design tokens added |
| `docs/document-apps.md` | TextEdit/Preview launch behavior or empty-state UX changes |
| `docs/weather-scenes.md` | weather scene architecture, shared renderer behavior, or effect tuning changes |
| `README.md` | new apps added or architecture changes |

## conventions

- **state persistence**: sessionStorage for view state, localStorage only for user-created content. window close clears view state via `clearAppState()` automatically
- **window management**: `useWindowManager()` for operations, `useWindowFocus()` for focus state
- **desktop vs mobile**: use `isMobileView` / `isDesktop` prop, never raw viewport queries
- **hover states**: gate hover-only styles with Tailwind's `can-hover:` variant so touch devices never get sticky hover treatments
- **menu system**: menus are mutually exclusive via `openMenu` state in `menu-bar.tsx`. panel-style menus follow the `status-menus.tsx` pattern. use `useClickOutside()` for dismissal
- **app discoverability + availability**: define Dock, Finder, and mobile support policy in `lib/app-config.ts` (`showOnDockByDefault`, `showInFinderApplications`, and `mobile.*`). avoid hardcoded app-id allow/deny lists in app components
- **finder + document apps**: Finder is multi-window on desktop. keep per-window Finder browsing state inside the Finder window/app pair, and keep TextEdit/Preview launch roots aligned with `components/desktop/desktop.tsx`, route files, and `docs/document-apps.md`
- **weather scenes**: weather visuals are shared between the weather app and notification center. use `components/apps/weather/weather-scene-effects.tsx` for scene rendering and `lib/weather.ts` for palettes/effect selection instead of duplicating scene markup
