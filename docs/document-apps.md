# Document Apps

This note captures how file-backed document apps should launch in the desktop shell.

## Current Behavior

### TextEdit

- `TextEdit` only opens when a text file path is available.
- Navigating to `/textedit` without a valid `file` query redirects to Finder.
- Finder opens text files in `TextEdit` windows, and those windows persist edited file contents by file path.

### Preview

- `Preview` only opens when an image or PDF path is available.
- Navigating to `/preview` without a valid `file` query redirects to Finder.
- Finder opens images and PDFs in `Preview` windows, each backed by a real file path.

## Why This Split Exists

- In this codebase, both apps are treated as document viewers/editors for existing files rather than standalone launch surfaces.
- Falling back to Finder keeps the user in the file-selection flow instead of showing a fake blank document state.

## Launch Plumbing

- `app/(desktop)/textedit/page.tsx` and `app/(desktop)/preview/page.tsx` enforce the file requirement for direct routes.
- `components/desktop/desktop.tsx` treats `TextEdit` and `Preview` as Finder-routed apps when no document is available, switching Finder to `Recents` so the user can pick a file immediately.
- `lib/shell-routing.ts` only generates desktop URLs for these apps when a `filePath` is present.

## Manual Test Plan

Run `npm run build`, then verify:

1. Navigate to `/textedit` with no `file` query and confirm the shell redirects to `/finder`.
2. Navigate to `/preview` with no `file` query and confirm the shell redirects to `/finder`.
3. Click `TextEdit` or `Preview` from Finder's Applications view and confirm Finder switches to `Recents` instead of staying on Applications.
4. Open a text file from Finder and confirm it opens in a `TextEdit` window.
5. Edit that text file, minimize and restore the window, and confirm the content stays in sync for that file path.
6. Open an image or PDF from Finder and confirm it opens in a `Preview` window with the existing viewer behavior.
7. Navigate directly to `/textedit?file=<valid text file>` and `/preview?file=<valid image-or-pdf>` and confirm deep links still work.
