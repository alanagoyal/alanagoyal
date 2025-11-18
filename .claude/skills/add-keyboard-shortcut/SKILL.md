---
name: add-keyboard-shortcut
description: This skill guides you through adding a new keyboard shortcut to the notes application, following the existing patterns in the sidebar component.
---

## When to Use This Skill

- Adding a new feature that needs keyboard access
- Want to improve user productivity with keyboard shortcuts
- Need to add navigation or action shortcuts

## Repository Context

The app has an extensive keyboard shortcut system in `/workspace/repo/components/sidebar.tsx`:
- **Navigation**: j/k (vi-style), arrow keys
- **Actions**: n (new note), p (pin/unpin), d (delete), t (theme toggle)
- **Search**: / (focus search), Escape (clear search)
- **Command**: Cmd+K / Ctrl+K (command palette)

**Pattern**: All keyboard shortcuts are handled in a single large useEffect in the Sidebar component.

## Existing Keyboard Shortcuts

Located in `/workspace/repo/components/sidebar.tsx:340-404`

| Key | Action | Condition |
|-----|--------|-----------|
| `j` | Navigate down | Not typing |
| `k` | Navigate up | Not typing |
| `↓` | Navigate down | Not typing |
| `↑` | Navigate up | Not typing |
| `Enter` | Open highlighted note | Not typing |
| `n` | Create new note | Not typing |
| `p` | Pin/unpin highlighted note | Not typing |
| `d` | Delete highlighted note | Not typing |
| `t` | Toggle theme (dark/light) | Not typing |
| `/` | Focus search | Not typing |
| `Escape` | Clear search, blur input | Always |
| `Cmd+K` / `Ctrl+K` | Open command menu | Always |

**"Not typing" check**: Prevents shortcuts from firing when user is typing in text fields.

## Step-by-Step Process

### Step 1: Locate Keyboard Handler

Open `/workspace/repo/components/sidebar.tsx` and find the keyboard event handler useEffect (around line 340).

```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const isTyping =
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
      target.isContentEditable;

    // Keyboard shortcut logic here
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [/* dependencies */]);
```

### Step 2: Add New Shortcut

**Pattern 1: Simple Action (No Typing Check)**
```typescript
// Allow even when typing (like Escape, Cmd+K)
if (event.key === "Escape") {
  event.preventDefault();
  // Action logic
  return;
}
```

**Pattern 2: Action When Not Typing (Most Common)**
```typescript
if (!isTyping) {
  if (event.key === "x") {
    event.preventDefault();
    // Action logic
    return;
  }
}
```

**Pattern 3: Action with Modifier Keys**
```typescript
if (
  (event.metaKey || event.ctrlKey) &&
  event.key === "k"
) {
  event.preventDefault();
  // Action logic
  return;
}
```

### Step 3: Implement Action Logic

**Option A: Call Existing Function**
```typescript
if (!isTyping) {
  if (event.key === "f") {
    event.preventDefault();
    handleFavoriteToggle(highlightedNote?.slug); // Existing function
    return;
  }
}
```

**Option B: Inline Logic**
```typescript
if (!isTyping) {
  if (event.key === "a") {
    event.preventDefault();
    // Inline action
    console.log("Action triggered");
    toast({ title: "Action performed" });
    return;
  }
}
```

**Option C: Set State**
```typescript
if (!isTyping) {
  if (event.key === "s") {
    event.preventDefault();
    setShowModal(true); // Toggle modal
    return;
  }
}
```

### Step 4: Update useEffect Dependencies

If your shortcut uses variables from component scope, add them to dependency array:

```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // ... shortcut logic that uses myFunction
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [
  navigateNotes,
  highlightedNote,
  handlePinToggle,
  // Add your dependencies here
  myFunction, // <-- Add this
]);
```

**⚠️ Warning**: Too many dependencies cause the effect to re-run frequently. Consider using `useCallback` to stabilize functions.

### Step 5: Document Shortcut (Optional)

Add to command menu (`/workspace/repo/components/command-menu.tsx`) or create a help dialog.

**Example: Add to Command Menu**
```typescript
// In /workspace/repo/components/command-menu.tsx
<CommandItem
  onSelect={() => {
    myAction();
    setOpen(false);
  }}
>
  <Icon className="mr-2 h-4 w-4" />
  <span>My Action</span>
  <CommandShortcut>X</CommandShortcut>
</CommandItem>
```

## Example: Adding "Favorite" Shortcut

Let's add a shortcut to toggle favorite on highlighted note.

### Step 1: Add Action Function (if needed)
```typescript
// In /workspace/repo/components/sidebar.tsx
const handleFavoriteToggle = useCallback(
  async (slug: string | null) => {
    if (!slug) return;

    const note = notes.find(n => n.slug === slug);
    if (!note) return;

    // Call RPC to toggle favorite
    const { error } = await supabase.rpc("toggle_note_favorite", {
      uuid_arg: note.id,
      session_arg: sessionId,
    });

    if (error) {
      toast({ title: "Failed to toggle favorite" });
      return;
    }

    // Refresh notes
    refreshSessionNotes();
    toast({ title: note.favorited ? "Removed from favorites" : "Added to favorites" });
  },
  [notes, sessionId, refreshSessionNotes]
);
```

### Step 2: Add Keyboard Shortcut
```typescript
// In the handleKeyDown function
if (!isTyping) {
  // Existing shortcuts...

  // Add favorite shortcut (f key)
  if (event.key === "f") {
    event.preventDefault();
    handleFavoriteToggle(highlightedNote?.slug);
    return;
  }
}
```

### Step 3: Update Dependencies
```typescript
useEffect(() => {
  // ... handleKeyDown logic
}, [
  navigateNotes,
  highlightedNote,
  handlePinToggle,
  handleNoteDelete,
  handleFavoriteToggle, // <-- Add this
  // ... other dependencies
]);
```

### Step 4: Add to Command Menu
```typescript
// In /workspace/repo/components/command-menu.tsx
<CommandItem
  onSelect={() => {
    handleFavoriteToggle(selectedNoteSlug);
    setOpen(false);
  }}
>
  <Star className="mr-2 h-4 w-4" />
  <span>Toggle Favorite</span>
  <CommandShortcut>F</CommandShortcut>
</CommandItem>
```

## Advanced: Adding Shortcuts to Other Components

Sometimes you want shortcuts in specific components (e.g., note editor).

**Example: Add Cmd+S to Save Note**

```typescript
// In /workspace/repo/components/note.tsx
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Cmd+S or Ctrl+S to save immediately
    if ((event.metaKey || event.ctrlKey) && event.key === "s") {
      event.preventDefault();
      // Flush debounced save immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      // Call save function directly
      performSave();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [performSave]);
```

**Note**: Component-specific shortcuts should be added to that component, not the global sidebar handler.

## Shortcut Patterns

### Pattern 1: Single Key (No Modifier)
```typescript
if (event.key === "x") {
  event.preventDefault();
  action();
}
```
**Use for**: Quick actions (delete, pin, etc.)

### Pattern 2: Modifier + Key
```typescript
if ((event.metaKey || event.ctrlKey) && event.key === "s") {
  event.preventDefault();
  action();
}
```
**Use for**: Save, open, close actions

### Pattern 3: Shift + Key
```typescript
if (event.shiftKey && event.key === "K") {
  event.preventDefault();
  action();
}
```
**Use for**: Reverse actions (Shift+Tab = backward, etc.)

### Pattern 4: Modifier + Shift + Key
```typescript
if (
  (event.metaKey || event.ctrlKey) &&
  event.shiftKey &&
  event.key === "P"
) {
  event.preventDefault();
  action();
}
```
**Use for**: Advanced features (Cmd+Shift+P = command palette in VS Code)

## Common Pitfalls

### ❌ Pitfall 1: Forgetting preventDefault()
```typescript
// BAD: Browser default action fires
if (event.key === "t") {
  toggleTheme(); // Browser still handles 't' key
}

// GOOD: Prevent browser default
if (event.key === "t") {
  event.preventDefault();
  toggleTheme();
}
```

### ❌ Pitfall 2: Not Checking isTyping
```typescript
// BAD: Shortcut fires when typing in search
if (event.key === "d") {
  deleteNote(); // Triggers when typing "delete" in search!
}

// GOOD: Check if user is typing
if (!isTyping) {
  if (event.key === "d") {
    event.preventDefault();
    deleteNote();
  }
}
```

### ❌ Pitfall 3: Missing Return Statement
```typescript
// BAD: Other shortcuts might fire after this one
if (event.key === "n") {
  event.preventDefault();
  createNote();
  // No return - keeps checking other shortcuts
}

// GOOD: Return after handling
if (event.key === "n") {
  event.preventDefault();
  createNote();
  return; // Stop checking other shortcuts
}
```

### ❌ Pitfall 4: Not Handling Mac vs Windows
```typescript
// BAD: Only works on Mac
if (event.metaKey && event.key === "s") {
  save();
}

// GOOD: Works on both Mac (Cmd) and Windows (Ctrl)
if ((event.metaKey || event.ctrlKey) && event.key === "s") {
  event.preventDefault();
  save();
}
```

### ❌ Pitfall 5: Missing useEffect Cleanup
```typescript
// BAD: Event listener not removed on unmount
useEffect(() => {
  window.addEventListener("keydown", handleKeyDown);
  // No cleanup - memory leak!
}, []);

// GOOD: Remove listener on cleanup
useEffect(() => {
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [handleKeyDown]);
```

## Testing Shortcuts

1. **Open browser console**: Check for errors when pressing shortcuts
2. **Test in different contexts**:
   - When search input is focused
   - When note editor is focused
   - When nothing is focused
3. **Test on different platforms**:
   - Mac (Cmd key)
   - Windows (Ctrl key)
   - Linux (Ctrl key)
4. **Test with modifier keys**:
   - Shift + Key
   - Cmd/Ctrl + Key
   - Cmd/Ctrl + Shift + Key

## Keyboard Shortcut Conventions

Follow these conventions for consistency:

| Convention | Shortcut | Example |
|------------|----------|---------|
| New/Create | `n` | New note |
| Delete | `d` | Delete note |
| Edit/Rename | `e` or `r` | Edit title |
| Save | `Cmd+S` / `Ctrl+S` | Save note |
| Search | `/` | Focus search |
| Close/Cancel | `Escape` | Close modal |
| Open/Show | `o` | Open note |
| Toggle | `t` | Toggle theme |
| Navigate Up | `k` or `↑` | Previous note |
| Navigate Down | `j` or `↓` | Next note |
| Pin/Favorite | `p` or `f` | Pin note |
| Help | `?` | Show shortcuts |

## Related Files

- Sidebar (main keyboard handler): `/workspace/repo/components/sidebar.tsx`
- Command menu: `/workspace/repo/components/command-menu.tsx`
- Note editor: `/workspace/repo/components/note.tsx`
- Search component: `/workspace/repo/components/search.tsx`

## Additional Resources

- [MDN KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [Key Values Reference](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values)
- Repository architecture: `/workspace/repo/ARCHITECTURE.md`
