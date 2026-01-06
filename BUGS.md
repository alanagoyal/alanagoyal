# Desktop Environment Bugs

## Phase 1 - FIXED (Commit 609edae)

### 1. Duplicate Navigation Bars - FIXED
Added `isDesktop` prop to Nav components in both Notes and Messages apps. When `isDesktop={true}`, the internal traffic lights are hidden since the window wrapper provides them.

### 2. Clicking Notes Doesn't Switch Selection - FIXED
Updated Sidebar to use `onNoteSelect()` callback instead of `router.push()` when `isDesktop={true}`. This applies to all navigation: clicking notes, keyboard navigation (j/k), pinning, and deletion.

### 3. All SVGs Broken in Messages App - FIXED
Moved assets from `public/reactions/`, `public/message-bubbles/`, `public/typing-bubbles/`, and `public/sound-effects/` to `public/messages/` folder. Disabled the Next.js rewrite rules that were proxying `/messages/*` requests.

---

## Phase 2 - FIXED

### 4. Messages Sidebar Scroll Stuck - FIXED
Changed `h-dvh` to `h-full` in Messages App when `isDesktop={true}`. The `h-dvh` (100dvh) was causing height conflicts when embedded in a window with a title bar.

### 5. Notes Mobile Sidebar Not Full Screen - FIXED
Added `isMobile` prop to NotesApp and MessagesApp. When `isMobile={true}` (passed from mobile-shell), the apps render mobile-optimized views with proper full-screen sidebars and back navigation.

### 6. Window Drag Bounds Not Enforced - FIXED
Added bounds checking to window drag handler. Windows are now constrained to:
- Top: Can't go above menu bar
- Bottom: Keep at least 50px visible above dock
- Left/Right: Keep at least 100px visible on screen

### 7. Messages App URL State Management - FIXED
Created `updateUrl()` helper that conditionally calls `window.history.pushState()` only when `isDesktop={false}`. In desktop mode, URL updates are skipped.

---

## Remaining Bugs (To Be Verified/Fixed)

### 8. Command Menu (CMD+K) May Not Work in Windows
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
