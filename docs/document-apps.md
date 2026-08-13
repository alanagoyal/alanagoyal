# Document Apps

This note captures how file-backed document apps launch through Finder in the desktop shell.

## Current Behavior

### TextEdit

- `TextEdit` only opens when a text file path is available.
- Navigating to `/textedit` without a valid `file` query routes into the same Finder-picker flow as launching TextEdit from Finder.
- Choosing `TextEdit` from Finder's Applications view focuses the topmost open TextEdit document window if one exists; otherwise it opens a centered, slightly smaller Finder window at `Documents`.
- When TextEdit is explicitly kept in the desktop Dock, clicking its closed icon creates a new untitled document and opens a real TextEdit window; its running dot and Quit action then reflect that window. Clicking it with documents open brings those windows forward.
- Finder opens text files in `TextEdit` windows, and those windows persist edited file contents by file path.
- On desktop, TextEdit's File menu supports New, Open, Close, Save, Duplicate, and Rename. New and duplicated documents are durable local documents in Finder's `Documents` folder; Open launches a dedicated Finder picker; Rename updates the Finder-visible path without mutating GitHub project files.
- TextEdit caches edits as they are typed so closing a window does not lose work. Save explicitly commits the current modified date and clears the window's `Edited` status.
- On mobile, all TextEdit routes redirect to `/notes`; the Finder-picker behavior above is desktop-only.

### Preview

- `Preview` only opens when an image or PDF path is available.
- Navigating to `/preview` without a valid `file` query routes into the same Finder-picker flow as launching Preview from Finder.
- Choosing `Preview` from Finder's Applications view focuses the topmost open Preview document window if one exists; otherwise it opens a centered, slightly smaller Finder window at `Desktop`.
- When Preview is explicitly kept in the desktop Dock, clicking its closed icon opens that same Finder picker at `Desktop`; clicking it with documents open brings its windows forward.
- Finder opens images and PDFs in `Preview` windows, each backed by a real file path.
- On mobile, all Preview routes redirect to `/notes`; the Finder-picker behavior above is desktop-only.

## Why This Split Exists

- TextEdit can create a valid untitled document, so its closed Dock icon launches one. Preview still requires an image or PDF path, so its closed Dock icon opens Finder without pretending Preview is running.
- Finder is multi-window, so each document app can open its own file-picking context without hijacking an unrelated Finder window. Repeated launches focus that app's existing picker instead of stacking duplicates.

## Launch Plumbing

- `app/(desktop)/textedit/page.tsx` and `app/(desktop)/preview/page.tsx` open document windows when a valid file is provided and otherwise defer to the desktop shell's Finder-picker behavior.
- `lib/app-config.ts` marks Finder as a multi-window app.
- `lib/file-route-utils.ts` is the source of truth for local sample document paths, Finder fallback targets, and local file metadata shared across Finder, TextEdit, and Preview.
- `components/desktop/desktop.tsx` focuses an existing TextEdit/Preview document window first, and only falls back to opening a centered, slightly smaller Finder window at `Documents` for TextEdit and `Desktop` for Preview when that app has no open documents.
- `components/desktop/dock.tsx` delegates closed document-app launches to the desktop shell: TextEdit creates an untitled document, while Preview opens its shared Finder picker.
- `components/desktop/window.tsx` provides the shared desktop window shell, while `components/apps/finder/finder-app.tsx` owns per-window Finder browsing state.
- `lib/shell-routing.ts` only generates desktop URLs for these apps when a `filePath` is present.

## Manual Test Plan

Run `npm run build`, then verify:

1. Navigate to `/textedit` with no `file` query and confirm the shell opens the centered Finder picker at `Documents`.
2. Navigate to `/preview` with no `file` query and confirm the shell opens the centered Finder picker at `Desktop`.
3. Open a text file in TextEdit, then click `TextEdit` from Finder's Applications view and confirm the existing TextEdit document window is focused instead of opening Finder.
4. Open an image or PDF in Preview, then click `Preview` from Finder's Applications view and confirm the existing Preview document window is focused instead of opening Finder.
5. With no open TextEdit windows, click `TextEdit` from Finder's Applications view and confirm a new centered Finder window opens at `Documents`.
6. With no open Preview windows, click `Preview` from Finder's Applications view and confirm a new centered Finder window opens at `Desktop`.
7. Verify the original Finder window keeps its own location/history instead of being repurposed.
8. Open a text file from Finder and confirm it opens in a `TextEdit` window.
9. Edit that text file, minimize and restore it, and confirm the content stays in sync for that file path.
10. Open an image or PDF from Finder and confirm it opens in a `Preview` window with the existing viewer behavior.
11. Navigate directly to `/textedit?file=<valid text file>` and `/preview?file=<valid image-or-pdf>` and confirm deep links still work.
12. In TextEdit, use File → New and confirm an `Untitled.txt` document opens and appears in Finder's Documents folder.
13. Use File → Duplicate and Rename, then confirm the copied content, updated title, and Finder-visible file name persist after closing and reopening the document.
14. Edit a document and confirm the title shows `Edited`; use File → Save and confirm the marker clears before using File → Close.
15. With an iPhone user agent, confirm `/textedit`, `/textedit/<nested>`, `/preview`, and `/preview/<nested>` redirect to `/notes` while the same routes preserve their existing desktop behavior.
16. Keep TextEdit and Preview in the desktop Dock, remove Music, then refresh and confirm the persisted membership appears before paint without an enter animation or a flash of the registered defaults.
17. Quit TextEdit, click its kept Dock icon, and confirm a new untitled TextEdit window opens with a running dot and Quit action.
18. Quit Preview, click its kept Dock icon twice, and confirm one Finder picker opens at `Desktop` and is focused again while Preview remains dotless and offers Open until an image or PDF is selected.
