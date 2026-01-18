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
<div className="hover:bg-muted/50"> // Don't do this

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

## Navigation Bar

Standard nav bar pattern for app windows. Use `select-none` to prevent text selection when dragging the window:

```tsx
<div className="sticky top-0 z-[1] flex items-center justify-between px-4 py-2 bg-muted select-none">
  {/* Left: window controls or back button */}
  <div className="flex items-center gap-1.5">
    <button className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-700" />
    <button className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-700" />
    <button className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-700" />
  </div>

  {/* Center: title (optional) */}

  {/* Right: actions */}
</div>
```

The nav bar acts as the window drag handle on desktop - `select-none` prevents accidental text selection while dragging.

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
      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
  <div style={{ marginBottom: '64px' }}> {/* Space for fixed bottom elements */}
    {content}
  </div>
</ScrollArea>
```

Scrollbar styling is handled globally:
- Width: 10px (14px on hover)
- Thumb: `bg-gray-500 dark:bg-gray-400`
- Opacity animation on hover

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

## Layout Structure

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

## Common Patterns

### Empty State

```tsx
<div className="flex-1 flex items-center justify-center text-muted-foreground">
  <p>No items found</p>
</div>
```

### Loading State

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
| Photos | No | Not needed | - |
| Finder | No | Not needed | - |
| Settings | No | Not needed | - |

## Checklist for New Apps

When creating a new app, ensure:

- [ ] Sidebar uses `bg-muted` on desktop, `bg-background` on mobile
- [ ] Selected states use `#0A7CFF` background with white text (desktop only, no background on mobile)
- [ ] No hover states on sidebar items
- [ ] Icons use `text-muted-foreground` or `text-foreground`
- [ ] Nav bar includes window controls (desktop) or back button (mobile)
- [ ] Nav bar has `select-none` for drag handle area
- [ ] Search input follows standard styling
- [ ] List items are 70px height with proper truncation
- [ ] Dividers use `border-muted-foreground/20`
- [ ] Responsive patterns use `isMobileView` prop
- [ ] ScrollArea used for scrollable content
- [ ] If app has text inputs, add Escape handler to blur (enables `q` to quit)
