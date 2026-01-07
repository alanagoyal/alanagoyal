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

## Phase 3 - FIXED

### 8. Notes App Interactivity in Desktop Windows - FIXED
Clicking notes, keyboard navigation (j/k), and creating new notes now work correctly in desktop windows. Added `isDesktop` prop throughout the component chain and used callbacks instead of router navigation.

### 9. Keyboard Shortcuts Firing Across Apps - FIXED
Added `data-app="notes"` and `data-app="messages"` attributes to app containers. All keyboard handlers now check `target.closest('[data-app]')` before handling, ensuring shortcuts only fire for the focused app.

### 10. Messages App Layout Overflow in Desktop - FIXED
Fixed sidebar not scrolling and input being cut off by:
- Using `h-full` instead of `h-dvh` when `isDesktop={true}`
- Adding `min-h-0` to flex children for proper shrinking
- Adding `overflow-hidden` to containers

### 11. Mobile Shell Navigation Issues - FIXED
Added `inShell` prop to NotesApp and MessagesApp. When in shell:
- URL updates are skipped (no navigation to /notes or /messages)
- Note items use callbacks instead of Links
- Back button uses callback instead of Link to /notes

### 12. Mobile Loading Flash - FIXED
Removed gradient background and "Loading..." text flash on mobile by:
- Using `bg-background` instead of gradient in page.tsx hydration placeholder
- Returning empty `bg-background` div during loading states
- Defaulting to Notes app instead of null state in MobileShell

---

## Remaining Bugs (Minor/To Be Verified)

### Theme Sync Across Windows
**Status:** To verify
**Description:** Theme changes may not properly propagate to all open windows.

### localStorage Stale References
**Status:** Low priority
**Description:** If app IDs change, saved window state could reference non-existent apps. No migration/validation currently exists.

### Messages App Shows Split View on Narrow Screens - FIXED
**Status:** Fixed
**Description:** Fixed by removing CSS `sm:` breakpoints and using `isMobileView` state consistently. In MobileShell mode, always uses mobile layout. In desktop mode, dynamically switches at 768px viewport width.

### Messages API Routes Not Working - FIXED
**Status:** Fixed
**Description:** Fixed API route paths from `/messages/api/chat` to `/api/chat` and `/messages/api/validate-contact` to `/api/validate-contact`. The old paths were remnants from when Messages was a separate app with basePath.
