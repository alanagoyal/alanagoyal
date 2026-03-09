# Document Apps

This note captures how the desktop shell should open document-style apps that do not always start from an existing file.

## Current Behavior

### TextEdit

- Opening `/textedit` with no `file` query opens a new untitled document window.
- The untitled document is editable immediately and keeps its draft content in window metadata for the current browser session.
- Untitled drafts are intentionally not written into the durable TextEdit file cache because they do not map to a real file path yet.

### Preview

- Opening `/preview` with no `file` query opens a no-document window instead of redirecting to Finder.
- The no-document window explains that Preview is waiting for an image or PDF and provides a `Browse in Finder` action.
- Preview does not pretend to have a blank canvas because the app is a viewer in this codebase, not a creation surface.

## Why This Split Exists

- `TextEdit` behaves like a creation app in macOS, so opening it should give the user somewhere to type immediately.
- `Preview` behaves like a document viewer in macOS, so opening it without a file should show a launcher-style empty state rather than a fake blank document.

## Launch Plumbing

- `components/desktop/desktop.tsx` owns launch behavior for multi-window document apps.
- Empty TextEdit and Preview windows use generated instance IDs rather than file paths so they can participate in the same multi-window state machine.
- `lib/shell-routing.ts` treats `/textedit` and `/preview` as valid shell routes even when no `file` query is present.

## Manual Test Plan

Run `npm run build`, then verify:

1. Navigate to `/textedit` with no `file` query. A new `Untitled` TextEdit window should open and the editor should be ready for input.
2. Type into the untitled TextEdit window, minimize it, restore it, and confirm the draft content is preserved.
3. Close the untitled TextEdit window and reopen `/textedit`. A fresh blank `Untitled` window should open.
4. Navigate to `/preview` with no `file` query. A Preview no-document window should open instead of redirecting to Finder.
5. In that Preview window, click `Browse in Finder`. Finder should open/focus and the shell URL should switch to `/finder`.
6. Open an image or PDF from Finder and confirm Preview still opens real file-backed windows with the existing viewer behavior.
7. Navigate directly to `/textedit?file=<valid text file>` and `/preview?file=<valid image or pdf>` and confirm file-backed deep links still work.
