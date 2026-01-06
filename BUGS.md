# Desktop Environment Bugs

## Critical (Blocks Core Functionality)

### 1. Duplicate Navigation Bars
**Affects:** Both Notes and Messages apps
**Description:** Each app window shows two navigation areas:
- The window title bar (with traffic lights - close/minimize/maximize)
- The app's original internal navigation bar

**Root Cause:** The NotesApp and MessagesApp components include their original Nav components which were designed for standalone use. The window wrapper adds its own title bar on top.

**Files involved:**
- `components/desktop/window.tsx` - adds title bar
- `components/apps/notes/sidebar.tsx` - has Nav component
- `components/apps/messages/sidebar.tsx` - has Nav component

---

### 2. Clicking Notes Doesn't Switch Selection
**Affects:** Notes app in desktop window
**Description:** Clicking on different notes in the sidebar doesn't load the selected note content.

**Root Cause:** The Sidebar component uses `router.push()` internally for navigation, but in the desktop environment we're not using Next.js routing. The `onNoteSelect` callback is passed but the sidebar may still be trying to use router-based navigation.

**Files involved:**
- `components/apps/notes/notes-app.tsx` - passes onNoteSelect
- `components/apps/notes/sidebar.tsx` - handles note clicks

---

### 3. All SVGs Broken in Messages App
**Affects:** Messages app - contact avatars, reaction icons, all UI icons
**Description:** SVG icons throughout the Messages app are not rendering.

**Root Cause:** Likely an import path issue after reorganizing files to `components/apps/messages/`. The icons may be referencing old paths or the icons folder wasn't properly moved.

**Files involved:**
- `components/apps/messages/icons/` - icon components
- Various message components that use icons

---

## High Priority (Degrades UX)

### 4. Messages Sidebar Scroll Stuck
**Affects:** Messages app sidebar
**Description:** The sidebar scrolls but gets stuck partway up and won't scroll to the very top.

**Root Cause:** Likely a CSS issue with the ScrollArea component or conflicting height calculations between the window container and the sidebar's internal scroll area.

**Files involved:**
- `components/apps/messages/sidebar.tsx`
- `components/desktop/window.tsx` - container sizing

---

### 5. Notes Mobile Sidebar Not Full Screen
**Affects:** Notes app on mobile devices
**Description:** On mobile, the Notes sidebar doesn't expand to full screen as it should.

**Root Cause:** The NotesApp component hardcodes `isMobile={false}` when rendering the Sidebar. The mobile detection isn't being passed through properly.

**Files involved:**
- `components/apps/notes/notes-app.tsx` - hardcoded isMobile
- `components/mobile/mobile-shell.tsx` - mobile app rendering

---

## Medium Priority (Polish Issues)

### 6. Window Drag Bounds Not Enforced
**Affects:** Desktop windows
**Description:** Windows can be dragged off-screen or behind the menu bar/dock.

**Root Cause:** The window dragging logic in `window.tsx` doesn't enforce boundaries to keep windows visible.

**Files involved:**
- `components/desktop/window.tsx`

---

### 7. Messages App URL State Management
**Affects:** Messages app in desktop window
**Description:** The Messages app uses `window.history.pushState()` which may cause unexpected browser history entries when used inside a window.

**Root Cause:** The app was designed for standalone use with URL-based state.

**Files involved:**
- `components/apps/messages/app.tsx` - selectConversation function

---

### 8. Command Menu (⌘K) May Not Work in Windows
**Affects:** Both apps
**Description:** The keyboard shortcut for command menu may not work when app is in a window context.

**Root Cause:** Keyboard event handling may be scoped incorrectly after embedding in windows.

**Files involved:**
- `components/apps/notes/command-menu.tsx`
- `components/apps/messages/command-menu.tsx`

---

### 9. Theme Not Synced Across Windows
**Affects:** Desktop environment
**Description:** Theme changes may not properly propagate to all open windows.

**Root Cause:** Each app may have its own theme handling that doesn't coordinate with the parent desktop shell.

**Files involved:**
- `components/theme-provider.tsx`
- App-specific theme toggles

---

## Low Priority (Minor Issues)

### 10. localStorage State May Have Stale App References
**Affects:** Desktop window restoration
**Description:** If app IDs change, saved window state in localStorage could reference non-existent apps.

**Root Cause:** No migration/validation of stored state against current app config.

**Files involved:**
- `lib/window-context.tsx`

---

### 11. Mobile Shell May Not Properly Show Apps
**Affects:** Mobile experience
**Description:** The mobile shell might not be rendering the actual app content correctly.

**Root Cause:** Mobile shell uses same app components but may need different props/context.

**Files involved:**
- `components/mobile/mobile-shell.tsx`
- `components/mobile/app-grid.tsx`
