# Document Apps

This note captures how file-backed document apps launch through Finder in the desktop shell.

## Current Behavior

### TextEdit

- `TextEdit` only opens when a text file path is available.
- Navigating to `/textedit` without a valid `file` query redirects to Finder.
- Choosing `TextEdit` from Finder's Applications view focuses the topmost open TextEdit document window if one exists; otherwise it opens a centered, slightly shorter Finder window rooted at `Projects`.
- Finder opens text files in `TextEdit` windows, and those windows persist edited file contents by file path.

### Preview

- `Preview` only opens when an image or PDF path is available.
- Navigating to `/preview` without a valid `file` query redirects to Finder.
- Choosing `Preview` from Finder's Applications view focuses the topmost open Preview document window if one exists; otherwise it opens a centered, slightly shorter Finder window rooted at `Documents`.
- Finder opens images and PDFs in `Preview` windows, each backed by a real file path.

## Why This Split Exists

- In this codebase, both apps are treated as document viewers/editors for existing files rather than standalone launch surfaces.
- Finder is multi-window, so document-app launches can open a fresh file-picking context when needed without hijacking whatever Finder window the user already has open.

## Launch Plumbing

- `app/(desktop)/textedit/page.tsx` and `app/(desktop)/preview/page.tsx` enforce the file requirement for direct routes.
- `lib/app-config.ts` marks Finder as a multi-window app.
- `components/desktop/desktop.tsx` focuses an existing TextEdit/Preview document window first, and only falls back to opening a centered, slightly shorter Finder window at `Projects` or `Documents` when that app has no open documents.
- `components/desktop/window.tsx` provides the shared desktop window shell, while `components/apps/finder/finder-app.tsx` owns per-window Finder browsing state.
- `lib/shell-routing.ts` only generates desktop URLs for these apps when a `filePath` is present.

## Manual Test Plan

Run `npm run build`, then verify:

1. Navigate to `/textedit` with no `file` query and confirm the shell redirects to `/finder`.
2. Navigate to `/preview` with no `file` query and confirm the shell redirects to `/finder`.
3. Open a text file in TextEdit, then click `TextEdit` from Finder's Applications view and confirm the existing TextEdit document window is focused instead of opening Finder.
4. Open an image or PDF in Preview, then click `Preview` from Finder's Applications view and confirm the existing Preview document window is focused instead of opening Finder.
5. With no open TextEdit windows, click `TextEdit` from Finder's Applications view and confirm a new Finder window opens at `Projects`.
6. With no open Preview windows, click `Preview` from Finder's Applications view and confirm a new Finder window opens at `Documents`.
7. Verify the original Finder window keeps its own location/history instead of being repurposed.
8. Open a text file from Finder and confirm it opens in a `TextEdit` window.
9. Edit that text file, minimize and restore it, and confirm the content stays in sync for that file path.
10. Open an image or PDF from Finder and confirm it opens in a `Preview` window with the existing viewer behavior.
11. Navigate directly to `/textedit?file=<valid text file>` and `/preview?file=<valid image-or-pdf>` and confirm deep links still work.
