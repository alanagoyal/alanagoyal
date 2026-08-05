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
- Inspect daily-delight Git history, the persistent coverage ledger, the current app registry, recent non-delight commits, and open pull requests before choosing an idea. Do not duplicate shipped or in-flight work.
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

## History and coverage memory

Treat the default branch's Git history as the authority for merged daily delights. Before generating candidates, inspect at least the last 45 days of first-parent merge history for the `daily-delight-YYYY-MM-DD-<slug>` branch pattern. Do not rely only on ordinary feature-commit subjects, which may omit “daily delight.” Confirm each match's primary surface and user-visible outcome from the merge diff or PR metadata rather than guessing from a vague slug.

Start the merged-history audit with:

```bash
git log --first-parent --merges --since="45 days ago" --regexp-ignore-case --grep="daily-delight-" --date=short --pretty=format:'%ad%x09%h%x09%s'
```

For scheduled runs, also use the `## Coverage ledger` at `~/.codex/automations/daily-macos-delight/memory.md` as a derived, compact cache. It makes rotation easy to scan and preserves open, not-yet-merged PRs that default-branch Git cannot contain. Read it before ideation, reconcile it to Git and current PR state, and update it before the final report. Git wins whenever the ledger disagrees. The detailed run diary is supporting evidence, not a substitute for either source.

Maintain two views because they answer different questions:

- **Last daily delight:** the most recent shipped daily-delight PR whose primary user-visible surface was that app or shell area. This is the main rotation signal. Secondary and shared touches stay visible in run history and the last-visible-touch date, but do not make a neglected app look recently featured.
- **Last visible touch:** the most recent merged user-visible change from any source. This prevents overlap with work outside the automation.

Use stable surface IDs: every current app ID from `lib/app-config.ts`, plus only the shell IDs that actually apply (`desktop`, `dock`, `menu-bar`, `notification-center`, `window-management`, and `shared-mobile`). A shared component change counts only for the surfaces whose visible behavior changed; do not reset every app merely because they share the component.

Keep the ledger compact and auditable:

- Maintain one snapshot row per registered app and active shell surface, including both dates, a short description, and the PR or commit.
- Maintain one recent-run row per shipped daily delight with date, primary surface, optional secondary surfaces, scope, outcome, PR, and status. Update the same row for follow-ups or merges instead of adding duplicate touches.
- Add an `open` run row as soon as a draft PR exists so the next run treats it as in flight, but do not advance either snapshot date until the PR merges. Mark the run row `merged` or `closed` after reconciling GitHub state, and update snapshot dates only for merged work.
- Retain at least the latest 30 days of run rows. Never count a rejected, closed-unmerged, no-op, or documentation-only run as a shipped touch.

If the automation memory is missing or unwritable, reconstruct a run-local coverage snapshot from the app registry, default-branch history, and open PRs. Continue safely because merged history remains durable in Git, but report that the derived cache could not be updated.

## Workflow

### 1. Establish current context

1. Before opening a GUI app for research or verification, record the frontmost app and which GUI apps are already running. Keep a run-local journal of every app, window, document, and browser tab opened for the task so cleanup does not rely on memory.
2. Read `AGENTS.md`, `docs/design-system.md`, `README.md`, and the files for likely surfaces.
3. Derive shipped daily-delight recency from the default branch's first-parent merge history, then read and reconcile the persistent coverage ledger against that history, `lib/app-config.ts`, recent non-delight changes, and open pull requests. Add newly registered apps, correct stale PR statuses, and refresh last-visible-touch dates before ideation.
4. Build a recency matrix for every registered app and active shell surface. Treat an app as neglected when it has no shipped daily delight in the last 14 days or falls in the least-recent third of registered apps; an open or very recent non-daily change can still make a specific idea ineligible for overlap.
5. Check for existing uncommitted work and avoid touching unrelated changes.
6. Exercise the unmodified candidate surface before editing. Record a compact baseline ledger for desktop and mobile: the visible affordance, each relevant click/tap target, and its result (navigation, playback, selection, dismissal, persistence, and so on). Do not infer interactive behavior from appearance or code alone.
7. Name the existing interaction contracts that must survive the change. Treat a card's primary action and any nested control's secondary action as separate contracts.

### 2. Generate and select

Generate 4-6 candidates across at least three categories and four distinct primary surfaces. At least two candidates must come from different neglected registered apps. If fewer than two neglected-app ideas survive the baseline-and-delta gate, record the concrete rejection reasons and fill the remaining slots from the next least-recent surfaces.

Do not select a primary surface used by either of the two most recent shipped daily delights unless every safe, finishable neglected-surface candidate fails the baseline-and-delta gate, or the owner explicitly requested that surface. Coverage improves candidate priority; it never rescues a weak or risky idea.

Candidate categories include:

- desktop shell fidelity;
- an existing app detail;
- a personal/storytelling detail;
- accessibility, touch, or responsive polish that does not introduce keyboard commands;
- a small bridge between two existing surfaces.

Apply this baseline-and-delta gate before scoring any candidate:

- **Already there:** state exactly what users can already see and do on current `main`.
- **Net-new outcome:** state one concrete user-visible capability or correction that does not exist in the baseline. Refactoring, semantic markup, a larger hit target, or making an existing control look different is not enough by itself unless it fixes a demonstrated accessibility or usability failure.
- **Preserved contracts:** list every adjacent baseline action that must remain unchanged.
- **Reviewer test:** describe how a reviewer can distinguish the result from the baseline without reading the diff.

Reject the candidate before scoring if the net-new outcome is vague, the reviewer test would look materially identical, or any unrelated interaction contract changes. Do not rescue a weak candidate by bundling additional behavior.

Score each candidate from 1-5 on:

- macOS authenticity;
- net-new visible delight or personal value relative to the current baseline;
- novelty relative to the current baseline, recent history, and open PRs;
- coverage balance, where 5 means a neglected app with no recent overlapping work and 1 means one of the last two daily surfaces or an in-flight surface;
- quality and intentionality across desktop and mobile;
- finishability in one unattended run;
- regression risk, where 5 means low risk.

Show the primary surface, its last-daily-delight date, its last-visible-touch date, and the coverage score beside every candidate. Select the highest-value candidate that satisfies the scope budget and cooldown. Break ties in favor of the higher coverage score, then the smaller change. Before editing, state a one-sentence acceptance criterion for desktop and mobile internally and keep the implementation within it.

Reject ideas that are only decorative, repackage an existing affordance, duplicate a native detail without making it functional, require invented personal data, create a dead-end control, add keyboard commands, change an established primary action as a side effect, or cannot be safely exercised on both desktop and mobile during the run.

### 3. Implement narrowly

1. Preserve every baseline interaction contract unless changing that exact contract is the chosen, evidenced delight. A secondary control must not replace or silently alter its container's primary navigation, selection, or open action.
2. Reuse existing components, state systems, tokens, and persistence conventions.
3. Use `isMobileView` / `isDesktop`; never add raw viewport checks.
4. Keep shared behavior shared. Add a mobile-specific presentation or interaction only when the form factor requires it, and do not let desktop-only hover, context-menu, or window assumptions leak into touch behavior.
5. Gate hover-only behavior with `can-hover:`.
6. Keep app availability in `lib/app-config.ts`, window operations in the window manager, and persisted state in the repository's established storage layers.
7. Update the relevant living documentation only when the shipped behavior changes what that document describes.
8. Add no speculative abstractions for a single small feature.

### 4. Verify the experience

1. Run the site and exercise the changed flow in a representative desktop viewport and a representative iPhone viewport with touch/coarse-pointer emulation. A narrow desktop viewport alone does not count as mobile verification.
2. Test the new outcome and replay every baseline interaction-contract row on both surfaces. If the delight is intentionally desktop-only, verify the corresponding mobile app or shell flow remains usable and unchanged. Include the most relevant empty, accessibility, dark-mode, and persistence states.
3. Capture at least two clear screenshots of the built result: one desktop and one mobile. Use states that make each surface's behavior easy to review, and keep framing and content representative of the real product. Save review captures outside the worktree, such as under `/private/tmp` or the active Codex artifact directory. Do not publish unless both surfaces have been visually verified.
4. Capture or document the macOS inspiration:
   - Prefer a screenshot from the installed macOS app or system surface when direct observation is available.
   - If a reference screenshot cannot be captured, provide a concise sourced explanation naming the macOS surface, the observed behavior, the evidence source, and how the implementation maps to it.
   - Clearly label reconstructions, extracted assets, or secondary references; never present them as live native screenshots.
   - A generic claim that something “feels Mac-like” is not evidence.
5. Run focused tests for the changed behavior when available, then run `npm run check`. Fix failures caused by the change. Do not hide or weaken checks.
6. Review the diff for accidental scope growth, hardcoded app lists, ungated hover states, desktop-only assumptions, fabricated personal content, unrelated formatting, and changed event propagation or navigation semantics.
7. Before committing, answer four adversarial questions: What could a user do before? What can they do now that they could not do before? Which prior workflows changed? Would the owner recognize the improvement without reading the diff? If the second answer is weak or the third includes an unrelated change, revert the candidate and ship nothing.

Synthetic keypresses in browser automation do not demonstrate that a shortcut is safe on a real computer. If an implementation happens to touch existing keyboard behavior, do not expand it and call out the need for owner testing rather than treating browser automation as proof of OS-level compatibility.

### 5. Publish for review

When GitHub access and permissions are available:

1. Create a branch named `codex/daily-delight-YYYY-MM-DD-<short-slug>`.
2. Confirm the staged and untracked file lists contain no reviewer screenshots or other pull-request-only images.
3. Commit only the intended product and documentation files with a concise imperative message.
4. Push the branch to `origin`.
5. Open a draft pull request against the default branch. Do not merge it.
6. Upload the review captures from outside the worktree as GitHub pull request attachments and place the resulting GitHub-hosted URLs in the pull request body.
7. Add the candidate to the derived coverage ledger's recent-run table with `open` status, leaving the merged-history snapshot dates unchanged. On every later run, reconcile prior rows to `merged` or `closed`; only a merged row advances snapshot dates.

Use this pull request structure:

```markdown
## Today's delight

<What changed and where.>

## Baseline and delta

- Before: <exact visible and interactive baseline>
- Now: <one concrete net-new outcome>
- Preserved: <primary and adjacent interaction contracts replayed after the change>

## Built result — desktop

![Desktop screenshot of the implemented delight](<desktop image URL>)

<What the desktop screenshot shows and what was tested.>

## Built result — mobile

![Mobile screenshot of the implemented delight](<mobile image URL>)

<What the mobile screenshot shows and what was tested, including touch behavior.>

## macOS inspiration

<Include a reference screenshot when available. Otherwise give a sourced explanation of the native surface and behavior. State exactly how the implementation maps to that evidence.>

## Why this one

<Why this behavior or personal value was the right bounded choice today, including the surface's last daily delight and last visible touch.>

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

Return the idea, scope class, selected surface and recency, coverage-ledger update, desktop and mobile behavior, verification result, desktop and mobile built-result screenshots, macOS reference screenshot or sourced inspiration explanation, draft PR URL, and cleanup result. If nothing shipped, return the candidates considered with their surfaces and recency, the concrete reason all were rejected, whether persistent coverage was updated, and the cleanup result.
