# Document Apps

This note captures how file-backed document apps launch through Finder in the desktop shell.

## Current Behavior

### TextEdit

- `TextEdit` only opens when a text file path is available.
- Navigating to `/textedit` without a valid `file` query redirects to Finder.
- Choosing `TextEdit` from Finder's Applications view opens a new Finder window rooted at `Projects`.
- Finder opens text files in `TextEdit` windows, and those windows persist edited file contents by file path.

### Preview

- `Preview` only opens when an image or PDF path is available.
- Navigating to `/preview` without a valid `file` query redirects to Finder.
- Choosing `Preview` from Finder's Applications view opens a new Finder window rooted at `Documents`.
- Finder opens images and PDFs in `Preview` windows, each backed by a real file path.

## Why This Split Exists

- In this codebase, both apps are treated as document viewers/editors for existing files rather than standalone launch surfaces.
- Finder is multi-window, so document-app launches can open a fresh file-picking context instead of hijacking whatever Finder window the user already has open.

## Launch Plumbing

- `app/(desktop)/textedit/page.tsx` and `app/(desktop)/preview/page.tsx` enforce the file requirement for direct routes.
- `lib/app-config.ts` marks Finder as a multi-window app.
- `components/desktop/desktop.tsx` opens a new Finder window at `Projects` for TextEdit app launches and at `Documents` for Preview app launches.
- `components/apps/finder/finder-window.tsx` is the dedicated multi-window Finder shell; `components/apps/finder/finder-app.tsx` owns the per-window browsing state.
- `lib/shell-routing.ts` only generates desktop URLs for these apps when a `filePath` is present.

## Manual Test Plan

Run `npm run build`, then verify:

1. Navigate to `/textedit` with no `file` query and confirm the shell redirects to `/finder`.
2. Navigate to `/preview` with no `file` query and confirm the shell redirects to `/finder`.
3. Open at least one Finder window manually, then click `TextEdit` from Finder's Applications view and confirm a new Finder window opens at `Projects`.
4. Click `Preview` from Finder's Applications view and confirm a new Finder window opens at `Documents`.
5. Verify the original Finder window keeps its own location/history instead of being repurposed.
6. Open a text file from Finder and confirm it opens in a `TextEdit` window.
7. Edit that text file, minimize and restore it, and confirm the content stays in sync for that file path.
8. Open an image or PDF from Finder and confirm it opens in a `Preview` window with the existing viewer behavior.
9. Navigate directly to `/textedit?file=<valid text file>` and `/preview?file=<valid image-or-pdf>` and confirm deep links still work.
