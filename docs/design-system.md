# Design System

This document outlines the design patterns and conventions for building apps in the OS. Follow these guidelines to ensure visual consistency across all applications.

## Color System

### Theme Colors (CSS Variables)

Use these semantic color variables instead of hardcoded values:

| Variable | Usage |
|----------|-------|
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary text, icons |
| `bg-background` | Main content areas |
| `bg-muted` | Sidebars, secondary surfaces |
| `border-muted-foreground/20` | Dividers, subtle borders |

### Accent Color

New apps should use the primary blue (`#0A7CFF`) for:
- Selected/active states
- Primary actions
- Interactive elements

Existing app accents (for reference):
- Messages: `#0A7CFF` (blue)
- Notes: `#FFE390` / `#9D7D28` (yellow)

## Sidebar Patterns

### Basic Structure

```tsx
<div className={cn(
  "flex flex-col h-full",
  isMobileView ? "w-full bg-background" : "w-[320px] bg-muted"
)}>
  {/* Nav bar */}
  {/* Search (optional) */}
  {/* Scrollable content */}
</div>
```

### Selected State

Sidebars should NOT have hover states on items. Use solid background for selected state on **desktop only**:

```tsx
// Correct - selected state only on desktop
<div className={cn(
  "px-2 py-1.5 rounded-lg",
  isSelected && !isMobileView && "bg-[#0A7CFF] text-white"
)}>

// Incorrect - avoid hover states in sidebars
<div className="can-hover:hover:bg-muted/50"> // Don't do this

// Incorrect - applying selected background on mobile
<div className={isSelected && "bg-[#0A7CFF]"}> // Don't do this on mobile
```

**Why no selected state on mobile?** On mobile, tapping a sidebar item navigates to the detail view (full-screen), so there's no split view where selection needs to be indicated. The selected state is only meaningful on desktop where sidebar and content are visible simultaneously.

### List Items

Standard list item height is 70px with consistent structure:

```tsx
<div className="flex items-center gap-3 px-2 py-1.5 h-[70px]">
  {/* Avatar/Icon: 40-48px */}
  <div className="w-10 h-10 rounded-full" />

  {/* Content: flex-1 with truncation */}
  <div className="flex-1 min-w-0">
    <p className="truncate font-medium">{title}</p>
    <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
  </div>

  {/* Right side: timestamp, status, etc. */}
  <span className="text-xs text-muted-foreground">{time}</span>
</div>
```

### Dividers

Use pseudo-element borders between items (not on selected items):

```tsx
<div className={cn(
  !isSelected && "after:content-[''] after:absolute after:bottom-0 after:left-14 after:right-0 after:border-t after:border-muted-foreground/20"
)}>
```

## Icons

### Color Usage

Always use `text-foreground` or `text-muted-foreground` for icons. Never use hardcoded colors:

```tsx
// Correct
<SearchIcon className="text-muted-foreground" />
<ChevronLeft className="text-foreground" />

// Incorrect
<SearchIcon className="text-gray-500" />
<ChevronLeft className="text-[#666]" />
```

Exception: Back/navigation chevrons can use the app's accent color:

```tsx
<ChevronLeft className="text-[#0A7CFF]" />
```

### Icon Sizing

- Default: 16px (`size={16}`)
- Compact (search bars): 14px
- Prominent (back buttons): 20-24px

### Compact Command Menus

Desktop context menus and compact action popovers use 16px icons with an 8px
gap between the icon gutter and label (`h-4 w-4 shrink-0` plus `gap-2`). Keep
the gutter present for every iconized command in a menu so labels align. Toggle
and radio menus use a checkmark in that gutter when the native surface shows
selection state; do not force icons onto native text-only system commands such
as the Dock magnification action. Destructive icons inherit the destructive
text color.

Touch action sheets may use 20px icons with a 12px gap to match their larger
row height and tap targets.

App-specific context menus and action popovers use the app accent for their
highlighted item. Notes uses `#FFE390` with dark text in light mode and
`#9D7D28` with white text in dark mode.

## Navigation Bar

Standard nav bar pattern for app windows. Use `select-none` to prevent text selection when dragging the window:

```tsx
<div className="sticky top-0 z-[1] flex items-center justify-between px-4 py-2 bg-muted select-none">
  {/* Left: window controls or back button */}
  <div className="flex items-center gap-1.5">
    <button className="w-3 h-3 rounded-full bg-red-500 can-hover:hover:bg-red-700" />
    <button className="w-3 h-3 rounded-full bg-yellow-500 can-hover:hover:bg-yellow-700" />
    <button className="w-3 h-3 rounded-full bg-green-500 can-hover:hover:bg-green-700" />
  </div>

  {/* Center: title (optional) */}

  {/* Right: actions */}
</div>
```

The nav bar acts as the window drag handle on desktop - `select-none` prevents accidental text selection while dragging. `WindowNavShell` marks that drag surface for the shared window manager, so double-clicking neutral title-bar space fills the area between the menu bar and Dock; double-clicking again restores the prior frame. Nested controls are excluded automatically, so do not add per-app double-click handlers.

### Hover States

Any hover-only affordance must be gated behind the `can-hover` variant so it does not stick on touch devices:

```tsx
<button className="can-hover:hover:bg-accent can-hover:hover:text-accent-foreground" />
<div className="group can-hover:group-hover:opacity-100" />
```

### Shared Nav Components

Use shared nav primitives instead of hand-rolling spacing and drag behavior:

- `WindowNavShell` (`components/window-nav-shell.tsx`): slot-based nav row (`left`, optional `center`, `right`) with consistent sticky spacing and mobile/desktop backgrounds.
- `WindowNavSpacer` (`components/window-nav-shell.tsx`): standard invisible right-side spacer that balances traffic-light controls.
- `useWindowNavBehavior` (`lib/use-window-nav-behavior.ts`): shared shell/close/minimize/maximize/drag behavior.

Photos uses an app-specific fixed header frame in
`components/apps/photos/header.tsx`. Every Photos top bar—including the
sidebar toolbar, grid, viewer, and restored-viewer loading state—must reserve
the shared 69px height. Keep subtitle and border space mounted when their
content is hidden so asynchronous data and scroll-state changes cannot move
the header contents.

```tsx
const nav = useWindowNavBehavior({ isDesktop, isMobile: isMobileView });

<WindowNavShell
  isMobile={isMobileView}
  isScrolled={isScrolled}
  onMouseDown={nav.onDragStart}
  left={
    <WindowControls
      inShell={nav.inShell}
      onClose={nav.onClose}
      onMinimize={nav.onMinimize}
      onToggleMaximize={nav.onToggleMaximize}
      isMaximized={nav.isMaximized}
      closeLabel={nav.closeLabel}
    />
  }
  right={<WindowNavSpacer isMobile={isMobileView} />}
/>
```

### Preventing Title/Path Overflow

When center content is dynamic (file names, folder paths, breadcrumb strings), long text can push nav controls out of layout. Use this structure:

- Nav row: `min-w-0`
- Left/right control groups: `shrink-0`
- Center lane: `flex-1 min-w-0`
- Title/breadcrumb text: `block truncate` (optionally set `title={fullValue}` for hover)

```tsx
<div className="flex min-w-0 items-center justify-between px-4 py-2 select-none">
  <div className="shrink-0">{/* left controls */}</div>
  <div className="flex-1 min-w-0 px-2 text-center">
    <span className="block truncate">{titleOrPath}</span>
  </div>
  <div className="shrink-0">{/* right controls */}</div>
</div>
```

### Preventing Drag on Interactive Elements

When the nav bar has `onMouseDown={windowFocus?.onDragStart}` for window dragging, any buttons inside will also trigger the drag. **Always add `onMouseDown={(e) => e.stopPropagation()}` to interactive elements** in the nav bar:

```tsx
<div
  className="nav-bar"
  onMouseDown={inShell ? windowFocus?.onDragStart : undefined}
>
  <WindowControls ... />

  {/* Wrap button groups with stopPropagation */}
  <div onMouseDown={(e) => e.stopPropagation()}>
    <Button onClick={onAction}>Action</Button>
  </div>

  {/* Or add directly to individual buttons */}
  <button
    onClick={onAction}
    onMouseDown={(e) => e.stopPropagation()}
  >
    Action
  </button>
</div>
```

On mobile, replace window controls with a back button:

```tsx
{isMobileView ? (
  <button onClick={onBack} className="flex items-center gap-1 text-[#0A7CFF]">
    <ChevronLeft size={24} />
    <span>Back</span>
  </button>
) : (
  <WindowControls />
)}
```

## Search Input

Consistent search bar styling across apps:

```tsx
<div className="relative">
  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
  <input
    type="text"
    placeholder="Search"
    className="w-full pl-8 pr-8 py-0.5 rounded-lg bg-[#E8E8E7] dark:bg-[#353533] placeholder:text-muted-foreground focus:outline-none"
  />
  {value && (
    <button
      onClick={onClear}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground can-hover:hover:text-foreground"
    >
      <X size={14} />
    </button>
  )}
</div>
```

## Scroll Areas

Use the custom ScrollArea component with consistent styling:

```tsx
<ScrollArea className="flex-1">
  {content}
</ScrollArea>
```

Scrollbar styling is handled globally:
- Width: 10px (14px on hover)
- Thumb: `bg-gray-500 dark:bg-gray-400`
- Opacity animation on hover
- Bottom margin: `0` by default

Only pass `bottomMargin` when the scrollbar track must clear a fixed bottom
overlay. The Messages conversation view does this with its dynamic composer
height; ordinary app content should use the zero default.

## Responsive Patterns

Handle mobile vs desktop inline using `isMobileView` prop:

```tsx
// Width
className={isMobileView ? "w-full" : "w-[320px]"}

// Background
className={isMobileView ? "bg-background" : "bg-muted"}

// Text size
className="text-base sm:text-sm"

// Padding
className={isMobileView ? "py-3" : "py-1.5"}
```

### App Mobile Availability

Every app, including Dock apps and desktop utilities, must declare its mobile
support policy:

- Set `mobile.supported` explicitly in `lib/app-config.ts`; there is no implicit support default.
- Unsupported apps use `notes` as `mobile.shellFallbackAppId`, `/notes` as
  `mobile.directRouteRedirectTo`, and `mobile.showInFinderApplications: false`.
- Guard both the root route and catch-all route for every unsupported app with
  `redirectIfUnsupportedOnMobile(appId)` so direct mobile visits redirect before rendering.
- Keep unsupported apps out of `MobileShell`, and remove their mobile-only props,
  render branches, and styles rather than preserving unreachable presenters.
- Keep desktop behavior unchanged.

## Layout Structure

### Default Window Placement

App window presets are normalized in `lib/window-context.tsx` when a window is
created. Preserve each app's configured position and size when they fit; if the
window would reach the Dock, move it upward first and reduce only the excess
height. Keep a small visual gap above the Dock. Do not apply this normalization
to restored layouts, because users expect their saved window arrangement to be
preserved.

### Split View (Desktop)

```
┌─────────────────────────────────────────────┐
│ Sidebar (320px)  │  Main Content            │
│ bg-muted         │  bg-background           │
│                  │                          │
│ - Nav bar        │  - Nav bar               │
│ - Search         │  - Content               │
│ - List           │  - Input (if applicable) │
└─────────────────────────────────────────────┘
```

### Mobile View

```
┌──────────────────┐     ┌──────────────────┐
│ Sidebar (full)   │ --> │ Detail (full)    │
│ w-full           │     │ w-full           │
│ bg-background    │     │ bg-background    │
└──────────────────┘     └──────────────────┘
```

### Mobile Launch Destination

For apps that collapse a desktop sidebar and content pane into separate mobile
screens, open the app's primary content screen by default. The sidebar is a
navigation destination on mobile, not the landing screen. Persist whether the
user is viewing content or the sidebar in `sessionStorage` so refresh preserves
their current screen; closing and reopening the app resets to primary content.

Photos opens to Library and Music opens to Home. List-first communication and
capture apps are the exception: Messages must open to the conversation list and
Notes must open to the notes list so users can choose the item they want before
entering a detail view.

### Mobile Surface Consistency

For app-level mobile views, keep base surfaces consistent with semantic tokens:

- Top-level mobile app container must use `bg-background`.
- Mobile top bars/nav bars should also default to `bg-background` unless a documented app-specific exception exists.
- Do not use hardcoded `bg-zinc-*` or raw grayscale values for primary mobile app backgrounds.

## Common Patterns

### Settings Switches

Use `SettingsSwitch` (`components/apps/settings/settings-switch.tsx`) for
standalone toggles in System Settings instead of hand-building the track and
thumb. It is the shared 40×24 blue macOS control. Controls where the entire row
is itself the switch, such as Focus modes, may keep the switch visual
non-interactive inside the row to avoid nesting buttons.

### Desktop Notifications

Top-right banners use `DesktopNotificationBanner` for incoming Messages notifications. Keep promotional or long-lived content in Notification Center instead of showing it as a desktop banner.

Hovering or focusing a Notification Center card reveals a macOS-style circular
× control across the card's upper-left edge. Keep the card geometry unchanged
and expand the local scroll viewport's clipping boundary so the control can
overlap the Notification Center edge without being clipped. The control uses
the same translucent gray treatment as the incoming Messages banner and clears
only that card without activating its primary action. Store dismissals in `sessionStorage` against
each card's content signature: cleared cards stay hidden for the current tab
but return when their underlying content changes.
Messages renders only when at least one conversation is unread; do not show an
empty Messages card.

Notification Center cards share the same outer `mb-1.5 rounded-md p-3` geometry. Apply content-specific borders, radii, and backgrounds only inside that shared container; scene-based cards such as Weather may replace the standard `bg-muted` surface.

### Status Menu Popovers

Status icons that expose a dedicated native menu should use their own popover instead of opening the full Control Center. The active Focus icon follows this pattern through `FocusMenu`, including direct mode changes and durable timed choices.

Focus state and scheduled expiration live in `SystemSettingsContext`, not the popover, so duration choices survive menu dismissal, Settings navigation, reloads, background tabs, and desktop/mobile shell changes. Timed expiration must also dismiss any open Focus popover so the menu system cannot retain an invisible interaction lock. `Until this evening` means the same-day 7:00 PM cutoff and should not be offered after that cutoff. `Focus Settings…` should deep-link to the Focus category in System Settings, where the three modes use mutually exclusive switches backed by the same shared state. Turning on one switch turns the other two off; turning off the active switch leaves all modes off. An active timed mode shows its scheduled end time.

The Control Center Focus tile should stay generic only while Focus is off. When active, its title, icon, and accent identify the specific mode, while its second line reports `On` or the scheduled end time.

### Menu Bar Command Spacing

Keep the Apple icon visually separated from the focused app, then group the app title and its commands with `gap-1`. Each command already has `px-2`, so this produces a consistent roughly 20px text-to-text rhythm between the app title, File, Edit, View, and any future command menus. Do not add per-app margins between menu labels.

### Empty State

```tsx
<div className="flex-1 flex items-center justify-center text-muted-foreground">
  <p>No items found</p>
</div>
```

### Loading State

Finder List view uses the same column-header renderer while loading and after
rows arrive. Keep its geometry, sort caret, and label styling identical; apply
the loading pulse only to placeholder rows, never the header. List skeleton rows
match the loaded rows' 28px height, with centered 12px text bars and 16px icons
so placeholders align with the visible text rather than filling its line box.

```tsx
<div className="flex-1 flex items-center justify-center">
  <Spinner className="text-muted-foreground" />
</div>
```

### Destructive Actions

Use `text-red-600` for delete/destructive action text:

```tsx
<button className="text-red-600">Delete</button>
```

## Keyboard Shortcuts

### Global Shortcuts

The menu bar (`menu-bar.tsx`) handles the global `q` shortcut to quit/close the focused app:

```tsx
// Global handler - only fires when NOT in an input field
if (e.key.toLowerCase() === "q" && focusedAppId) {
  closeWindow(focusedAppId);
}
```

This handler automatically skips when the user is typing in an INPUT, TEXTAREA, or contentEditable element.

### Escape to Unfocus Pattern

Apps with text inputs must handle the **Escape** key to blur the active element. This allows the global `q` shortcut to work after pressing Escape.

**When to add Escape handling:**
- Apps with text inputs (search bars, message inputs, terminal inputs)
- Apps with rich text editors (contentEditable, ProseMirror)

**When NOT needed:**
- Apps without text inputs (Photos, Finder, Settings) - the `q` key works directly

**Implementation pattern:**

```tsx
// For apps with existing keyboard handlers (like Notes, Messages)
const handleKeyDown = (event: KeyboardEvent) => {
  // Check window focus first
  if (windowFocus && !windowFocus.isFocused) return;

  // Escape always blurs to allow global shortcuts
  if (event.key === "Escape") {
    (document.activeElement as HTMLElement)?.blur();
    return;
  }

  // ... other shortcuts
};
```

```tsx
// For input-specific handlers (like iTerm terminal)
const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  // ... other key handling

  if (e.key === "Escape") {
    (document.activeElement as HTMLElement)?.blur();
  }
};
```

**User flow:**
1. User is typing in an input field
2. User presses **Escape** → input loses focus
3. User presses **q** → app closes (handled by global menu bar)

### Apps with Keyboard Shortcuts

| App | Has Text Inputs | Escape Handler | Location |
|-----|-----------------|----------------|----------|
| Notes | Yes (search) | Yes | `sidebar.tsx` |
| Messages | Yes (search, message input) | Yes | `sidebar.tsx` |
| iTerm | Yes (terminal input) | Yes | `terminal.tsx` |
| TextEdit | Yes (textarea) | Yes | `textedit-window.tsx` |
| Photos | No | Not needed | - |
| Finder | No | Not needed | - |
| Settings | No | Not needed | - |

## Game Campaigns

Finite-round games use one five-level campaign pattern. Memory Match,
Minesweeper, and Breakout share the campaign configuration and progression
helpers in `lib/games/levels.ts` and the header/result primitives in
`components/apps/games/solo-games.tsx`.

- Show `Level X of 5` before game-specific metrics.
- Label the reset action `Restart Level` and keep it on the current level.
- On success, show `Level X complete!` and `Continue to Level Y`; after level
  five, show `All levels complete!` and `Play Again`.
- On failure, use `Try Again` and restart the current level.
- Save only the current campaign level in `sessionStorage` so returning from
  the Games library preserves progress. Clear it through `clearAppState()`
  when Games closes.
- Keep difficulty settings and endless score milestones distinct from levels.
  Chess, Snake, and 2048 do not use the campaign pattern.

## App State Persistence

### Storage Tiers

| Tier | Storage | Lifetime | Use Case |
|------|---------|----------|----------|
| **View/runtime state** | `sessionStorage` | Per-tab, clears on tab close | Desktop window layout, sidebar selection, scroll position, dock scale, recents, terminal history |
| **Session cache/runtime buffers** | `sessionStorage` | Per-tab, clears on tab close | API/UI caches and in-progress runtime state (e.g., GitHub cache, music playback queue/progress, Notes pinned ordering) |
| **Durable data + preferences** | `localStorage` | Persistent, shared across tabs | User-created content, user preferences, and anonymous identity (notes/messages data, settings, sound prefs, Notes `session_id`) |

Rule of thumb: if losing it on browser restart is acceptable, use `sessionStorage`. If users expect it to persist (content or preferences), use `localStorage`.

### Rules

1. **Close = clear**: When a window is closed (red button or Cmd+Q), its view state is cleared via `clearAppState(appId)`.
2. **Minimize = preserve**: Minimized windows keep their state in memory. Unminimizing restores exactly where the user left off.
3. **Window layout is tab-scoped**: The complete desktop window graph lives in `sessionStorage`, including open/minimized/maximized state, geometry, z-order, focus, multi-window instances, and window metadata. Refresh restores it; a new tab or browser session starts independently.
4. **Mixed persistence for list apps**: Persist user-managed collections in `localStorage`, but keep active selection/sort/filter/navigation in `sessionStorage`.
5. **Ephemeral caches belong in session storage**: Network caches and runtime buffers should use `sessionStorage` unless there's a product requirement for cross-session persistence.
6. **Use one policy, not one physical store**: Keep storage decisions behind focused persistence helpers. Do not move durable content into `sessionStorage` or emulate per-tab state inside `localStorage`.

### Desktop Window State

`lib/window-state-storage.ts` owns the browser-storage boundary for the desktop
window graph. `lib/window-context.tsx` owns validation and the window state
machine.

- Same-tab refresh restores the complete desktop.
- Separate tabs have independent desktops and cannot overwrite one another.
- Closing the tab ends its desktop session.
- Finder's explicit List sort is stored per window in its metadata alongside
  the folder and view mode. Refresh restores it, closing that window removes it,
  and a new Finder window uses its folder's default sort. Sorting preserves the
  selected file; it must not trigger the content area's deselection handler.
- Durable app content and preferences remain available when a fresh desktop starts.
- A one-time compatibility migration copies the legacy `localStorage`
  `desktop-window-state` value into the current tab's `sessionStorage`, then
  removes the durable copy only after the selected payload passes window-state
  validation. If tab storage is unavailable, the legacy value is retained so
  the user's existing layout is not discarded.

### Standard Behavior for List + Detail Apps

Use this exact behavior unless the app explicitly needs something else:

- **User-added list entries**: Persist across refresh and app close/open (`localStorage`).
- **Current selection**: Persist across refresh and minimize (`sessionStorage`).
- **Close and reopen app**: Reset selection to the top/default list item by clearing selection in `clearAppState(appId)`.

### Wiring Up State Clearing

When adding persistence to a new app:

1. Create `load`/`save`/`clear` functions in `sidebar-persistence.ts` (or export a `clear` function from the app's own module).
2. Add a `case "your-app-id"` to the `clearAppState()` switch in `sidebar-persistence.ts`.
3. That's it — `closeWindow` and `closeApp` in `window-context.tsx` already call `clearAppState(appId)` automatically. No manual clearing needed in nav bars or menu bar.

## Checklist for New Apps

When creating a new app, ensure:

- [ ] Sidebar uses `bg-muted` on desktop, `bg-background` on mobile
- [ ] Selected states use `#0A7CFF` background with white text (desktop only, no background on mobile)
- [ ] No hover states on sidebar items
- [ ] Icons use `text-muted-foreground` or `text-foreground`
- [ ] Nav bar includes window controls (desktop) or back button (mobile)
- [ ] Nav bar has `select-none` for drag handle area
- [ ] Nav bar buttons have `onMouseDown={(e) => e.stopPropagation()}` to prevent drag
- [ ] Search input follows standard styling
- [ ] List items are 70px height with proper truncation
- [ ] Dividers use `border-muted-foreground/20`
- [ ] Responsive patterns use `isMobileView` prop
- [ ] Mobile split-view apps launch into primary content; only list-first apps such as Messages and Notes launch into their list
- [ ] ScrollArea used for scrollable content
- [ ] If app has text inputs, add Escape handler to blur (enables `q` to quit)
- [ ] View/runtime/cache state and desktop window layout use `sessionStorage`
- [ ] Durable user content/preferences use `localStorage` and should not be cleared on app close
- [ ] `clearAppState()` has a case for this app's ID
- [ ] No manual `clear*Storage()` calls in nav bars or menu bar — handled automatically by `closeWindow`/`closeApp`
- [ ] `mobile.supported` is explicit; unsupported apps are hidden from Finder Applications on mobile and all mobile route access redirects to `/notes`
- [ ] Unsupported apps have no mobile-only presenter, prop branches, or styles
