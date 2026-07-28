---
name: daily-macos-delight
description: Choose, implement, verify, and publish one small, authentic macOS-inspired improvement for the alanagoyal desktop website, with intentional behavior and visual verification on both desktop and mobile. Use for the daily desktop-delight automation, proactive feature ideation, macOS parity sweeps, or requests to add a well-scoped personal detail without turning every run into a new app.
---

# Daily macOS Delight

Ship one reviewable improvement that makes this personal macOS-on-the-web feel more authentic, delightful, or revealing.

## Operating rules

- Work in the current repository and obey every applicable `AGENTS.md`.
- Read `docs/design-system.md` before changing UI.
- Start from the latest default branch when the environment permits it.
- Inspect the current app registry, recent commits, and open pull requests before choosing an idea. Do not duplicate shipped or in-flight work.
- Compare the site with a current real macOS behavior. Prefer Apple documentation or direct observation over memory when a detail could have changed. Record the evidence before implementation: what macOS does, where it was observed, and why it belongs in this desktop.
- Treat personal content as editorial: use only facts and assets already present in the repository or explicitly supplied by the owner. Never invent biographical claims or expose secrets/private data.
- Deliver working code, not an idea memo. If no candidate is safe, useful, and finishable, make no code change and report why.
- Treat visual evidence as part of the deliverable, not optional polish. Every shipped delight must show the built result and explain or show its macOS inspiration.
- Treat desktop and mobile as required surfaces for every candidate. Define the intended behavior on both before implementation. When a native detail is genuinely desktop-only, preserve the existing mobile experience and verify it has not regressed; otherwise, implement an appropriate mobile interaction rather than hiding the feature.
- Never add or commit reviewer screenshots, native references, comparison images, or other pull-request-only visual evidence to the repository. Capture them outside the worktree and publish them as GitHub-hosted pull request attachments.
- Treat shared Mac UI state as borrowed. Track every app, window, document, and browser tab opened for the run, then restore the desktop before completing, including after a blocked or failed run. This cleanup requirement must not discourage direct observation of native apps.

## Scope budget

Choose the smallest idea that produces a noticeable improvement.

| Class | Target frequency | Typical shape |
| --- | ---: | --- |
| Micro | about 70% of runs | One existing surface, 1-4 files, a focused control, state, menu item, animation, empty state, or macOS detail |
| Small | about 25% of runs | One contained interaction spanning an existing app or desktop subsystem, usually 2-7 files |
| Larger | at most 5% of runs | A compact new app or cross-desktop capability; only when clearly stronger than all smaller candidates |

Apply these hard limits:

- Do not choose a new app if one was added in the previous 30 days or if a medium/large feature landed in the previous 7 days.
- Do not add a backend, dependency, schema migration, external service, or authentication flow for a daily run unless the owner already approved it.
- Do not choose keyboard shortcuts or key-driven navigation for unattended daily runs. Browser shortcuts can conflict with macOS, browser, extension, and assistive-technology commands even when synthetic browser tests appear to pass.
- Do not bundle cleanup or unrelated fixes. Preserve one coherent user-visible idea per pull request.
- Prefer fewer than roughly 250 net new lines. Exceed that only when the implementation remains obviously contained and low risk.

Read [references/idea-catalog.md](references/idea-catalog.md) when generating candidates. It supplies directions, not a backlog; validate every idea against the current repository.

## Workflow

### 1. Establish current context

1. Before opening a GUI app for research or verification, record the frontmost app and which GUI apps are already running. Keep a run-local journal of every app, window, document, and browser tab opened for the task so cleanup does not rely on memory.
2. Read `AGENTS.md`, `docs/design-system.md`, `README.md`, and the files for likely surfaces.
3. Inspect `lib/app-config.ts`, recent Git history, and open pull requests if GitHub access is available.
4. Note the last several user-visible additions so today's work varies the surface and size.
5. Check for existing uncommitted work and avoid touching unrelated changes.

### 2. Generate and select

Generate 4-6 candidates across at least three categories:

- desktop shell fidelity;
- an existing app detail;
- a personal/storytelling detail;
- accessibility, touch, or responsive polish that does not introduce keyboard commands;
- a small bridge between two existing surfaces.

Score each candidate from 1-5 on:

- macOS authenticity;
- visible delight or personal value;
- novelty relative to recent history and open PRs;
- quality and intentionality across desktop and mobile;
- finishability in one unattended run;
- regression risk, where 5 means low risk.

Select the highest-value candidate that satisfies the scope budget. Break ties in favor of the smaller change. Before editing, state a one-sentence acceptance criterion for desktop and mobile internally and keep the implementation within it.

Reject ideas that are only decorative, duplicate a native detail without making it functional, require invented personal data, create a dead-end control, add keyboard commands, or cannot be safely exercised on both desktop and mobile during the run.

### 3. Implement narrowly

1. Reuse existing components, state systems, tokens, and persistence conventions.
2. Use `isMobileView` / `isDesktop`; never add raw viewport checks.
3. Keep shared behavior shared. Add a mobile-specific presentation or interaction only when the form factor requires it, and do not let desktop-only hover, context-menu, or window assumptions leak into touch behavior.
4. Gate hover-only behavior with `can-hover:`.
5. Keep app availability in `lib/app-config.ts`, window operations in the window manager, and persisted state in the repository's established storage layers.
6. Update the relevant living documentation only when the shipped behavior changes what that document describes.
7. Add no speculative abstractions for a single small feature.

### 4. Verify the experience

1. Run the site and exercise the changed flow in a representative desktop viewport and a representative iPhone viewport with touch/coarse-pointer emulation. A narrow desktop viewport alone does not count as mobile verification.
2. Test the primary interaction on both surfaces. If the delight is intentionally desktop-only, verify the corresponding mobile app or shell flow remains usable and unchanged. Include the most relevant empty, accessibility, dark-mode, and persistence states.
3. Capture at least two clear screenshots of the built result: one desktop and one mobile. Use states that make each surface's behavior easy to review, and keep framing and content representative of the real product. Save review captures outside the worktree, such as under `/private/tmp` or the active Codex artifact directory. Do not publish unless both surfaces have been visually verified.
4. Capture or document the macOS inspiration:
   - Prefer a screenshot from the installed macOS app or system surface when direct observation is available.
   - If a reference screenshot cannot be captured, provide a concise sourced explanation naming the macOS surface, the observed behavior, the evidence source, and how the implementation maps to it.
   - Clearly label reconstructions, extracted assets, or secondary references; never present them as live native screenshots.
   - A generic claim that something “feels Mac-like” is not evidence.
5. Run focused tests for the changed behavior when available, then run `npm run check`. Fix failures caused by the change. Do not hide or weaken checks.
6. Review the diff for accidental scope growth, hardcoded app lists, ungated hover states, desktop-only assumptions, fabricated personal content, and unrelated formatting.

Synthetic keypresses in browser automation do not demonstrate that a shortcut is safe on a real computer. If an implementation happens to touch existing keyboard behavior, do not expand it and call out the need for owner testing rather than treating browser automation as proof of OS-level compatibility.

### 5. Publish for review

When GitHub access and permissions are available:

1. Create a branch named `codex/daily-delight-YYYY-MM-DD-<short-slug>`.
2. Confirm the staged and untracked file lists contain no reviewer screenshots or other pull-request-only images.
3. Commit only the intended product and documentation files with a concise imperative message.
4. Push the branch to `origin`.
5. Open a draft pull request against the default branch. Do not merge it.
6. Upload the review captures from outside the worktree as GitHub pull request attachments and place the resulting GitHub-hosted URLs in the pull request body.

Use this pull request structure:

```markdown
## Today's delight

<What changed and where.>

## Built result — desktop

![Desktop screenshot of the implemented delight](<desktop image URL>)

<What the desktop screenshot shows and what was tested.>

## Built result — mobile

![Mobile screenshot of the implemented delight](<mobile image URL>)

<What the mobile screenshot shows and what was tested, including touch behavior.>

## macOS inspiration

<Include a reference screenshot when available. Otherwise give a sourced explanation of the native surface and behavior. State exactly how the implementation maps to that evidence.>

## Why this one

<Why this behavior or personal value was the right bounded choice today.>

## Verification

- `npm run check`
- Desktop: <viewport and interactions checked>
- Mobile: <device/viewport, touch mode, and interactions checked>
- <focused automated tests, when available>

## Scope

<Micro, small, or larger; note recent-feature/open-PR overlap checks.>
```

Before completing the pull request, ensure the desktop and mobile review images both render from stable GitHub-hosted attachment URLs, normally `https://github.com/user-attachments/...`. Never use a repository path, branch URL, committed image, or local-only path for pull request visual evidence.

If either desktop or mobile testing or screenshot capture cannot be completed, do not open the pull request; leave a clean local branch and commit when possible, then report the exact blocker. If attachment upload is blocked, keep the captures outside the worktree and report the exact tool or permission that blocked publication. Do not commit screenshots as a workaround. If pushing or opening a PR is blocked, report the exact blocker. Never claim a screenshot or PR exists without a reviewer-accessible image or URL.

### 6. Restore the shared Mac

Run this epilogue before the completion report on every exit path: success, no-op, blocked, aborted, or failed.

1. Close every task-owned browser tab, Finder window, document, preview, and other window recorded in the journal. In an app that was already running, close only the windows or tabs created by this run and restore any shared view the run changed when practical.
2. Quit every GUI application launched by the run that was not running in the initial snapshot. Use a normal quit, never force quit. For an unsaved disposable document created by the run, choose not to save; never dismiss, overwrite, save, or discard a pre-existing user document.
3. Do not quit an app that was already running before the task. Finder is expected to remain running; close only Finder windows opened by the run.
4. Restore the originally frontmost app when it can be done without disturbing user work.
5. Compare the final state with the initial snapshot and confirm that no task-launched app or task-owned window remains. If a save dialog, permission boundary, crash, or other condition prevents safe cleanup, leave user state untouched and name the exact remaining app or window in the completion report.

## Completion report

Return the idea, scope class, desktop and mobile behavior, verification result, desktop and mobile built-result screenshots, macOS reference screenshot or sourced inspiration explanation, draft PR URL, and cleanup result. If nothing shipped, return the candidates considered, the concrete reason all were rejected, and the cleanup result.
