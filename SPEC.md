# SPEC: alanagoyal.com Desktop Environment

## Overview

Combine two existing Next.js applications into a single macOS-style desktop environment hosted at alanagoyal.com.

## Current State

### Repository: `alanagoyal`
- Personal website styled as an Apple Notes clone
- Currently at alanagoyal.com (redirects to /notes)
- Contains pages like about, books, music, etc. styled as notes
- Allows users to create private notes saved to Supabase
- Mobile-responsive (sidebar becomes fullscreen on mobile)
- Tech: Next.js 14, Supabase with RPC functions, session-based auth

### Repository: `messages`
- iMessage clone for AI group chat conversations
- Chat with AI personas (50+ contacts including Steve Jobs, Einstein, etc.)
- OpenAI/Braintrust AI integration with function calling
- Real-time typing indicators and sound effects
- Mobile-responsive (conversation list becomes fullscreen on mobile)
- Tech: Next.js 15, localStorage persistence, TipTap editor

### Shared Tech Stack
- Next.js (App Router)
- Tailwind CSS + shadcn/ui components
- React
- Vercel
- No authentication (public sites)

---

## Desired End State

### Desktop Experience (screens >= 768px)

**Homepage (alanagoyal.com)**
- macOS-inspired desktop with fixed gradient background
- Menu bar at top (Apple logo on left, focused app name; date/time on right)
- Dock at bottom center with app icons
- Notes app opens by default on initial load

**Window System**
- Clicking an app icon opens it in a draggable window
- Windows have fixed sizes (resizing deferred to Phase 2)
- Windows have standard macOS-style title bar with:
  - Traffic light buttons (red close, ~~yellow minimize~~, green maximize)
  - Minimize functionality deferred to Phase 2
  - App title centered
- Multiple windows can be open simultaneously
- Clicking a window brings it to front (z-index management)
- Windows persist their position across sessions (localStorage)
- Maximized windows fill available space while keeping dock/menu bar visible
- No window snapping - free-form dragging only
- Transitions are instant (no animations)

**Window Sizing**
- Global default minimum size applies to all windows
- Per-app overrides allowed (e.g., Notes may need more width)
- Windows stay at fixed position on browser resize (may go off-screen)

**Dock Behavior**
- Shows all available apps with Apple system icons
- Indicator dot below open apps (same dot for both open and minimized)
- Hover effect on icons
- Clicking an open app's icon:
  - If minimized: restore it (Phase 2)
  - If visible: bring to front and focus

**URL Routing**
- All URLs remain at `/` (no deep linking)
- No shareable URLs for specific notes or conversations
- Full state persistence via localStorage:
  - Open windows and their positions
  - Active content within each app (selected note, conversation, etc.)
  - Window z-index order

**Keyboard Shortcuts**
- Basic shortcuts only: Cmd+K for command menu
- Focused window receives all other keyboard events
- No global window management shortcuts

**Command Menu (Cmd+K)**
- Primarily passes through to focused app's commands
- Few desktop-level actions (theme toggle, close window)

### Mobile Experience (screens < 768px)

**Home Screen**
- App grid with icons (iOS-style home screen)
- Tap to open app fullscreen

**Navigation**
- Bottom tab bar for switching between apps
- Each app renders fullscreen with its existing mobile layout
- Apps handle their own back navigation

**State**
- Persists last used app to localStorage
- Each app maintains its own mobile state

---

## Architecture Requirements

### State Management

**Window Manager Context**
- React Context with useReducer for all window state
- Tracks per window: open/closed, position, size, z-index, maximized
- Persists to localStorage on every state change
- Restores from localStorage on page load
- Sensible defaults when no localStorage exists:
  - Notes window centered, open
  - Messages window closed

### Component Strategy

**Gradual Migration Approach**
- Start with minimal sharing (buttons, inputs, basic primitives)
- Keep apps mostly separate initially
- Plan to unify more components over time
- Avoid big-bang refactoring

**Code Style**
- Balanced approach: abstract when there's clear benefit
- Prefer readability over cleverness
- Explicit over magic

### App Registration

Apps defined in central configuration with extended metadata:

```typescript
interface AppConfig {
  id: string;              // Unique identifier
  name: string;            // Display name
  icon: string;            // Path to icon asset
  description: string;     // Brief app description
  accentColor: string;     // App's accent color
  defaultPosition: { x: number; y: number };
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  menuBarTitle: string;    // Title shown in menu bar when focused
}
```

### Data Layer

**Notes App**
- Keep existing Supabase RPC pattern (refactor later)
- Maintain current ISR + session fetch behavior
- Public/private note visibility continues to work
- Supabase connection shared if future apps need database

**Messages App**
- Keep localStorage-only persistence
- Include all 50+ AI personas
- Maintain existing OpenAI/Braintrust integration

### Project Structure

```
/app
  /page.tsx              # Desktop shell (or mobile home)
  /api                   # Shared API routes
/components
  /desktop               # Desktop-specific components
    /window.tsx
    /dock.tsx
    /menu-bar.tsx
    /window-manager.tsx
  /apps
    /notes               # Notes app components
    /messages            # Messages app components
  /ui                    # Shared UI primitives
  /mobile                # Mobile-specific components
    /app-grid.tsx
    /tab-bar.tsx
/lib
  /window-context.tsx    # Window manager context
  /app-config.ts         # App registration
  /supabase              # Supabase utilities
/types
  /window.ts             # Window-related types
  /apps.ts               # App-related types
```

---

## Git Requirements

### Preserve History (Critical)

The final repository MUST contain git history from both repos:
- Use `alanagoyal` as the primary repo (target domain)
- Merge `messages` repo history using git subtree or similar strategy
- Goal: preserve full contribution history and commit logs from both projects

### Repository Setup
- Final repo lives at the `alanagoyal` repo location
- Both repos are currently public but can be made private during migration
- Hosted on Vercel at alanagoyal.com

---

## Performance Requirements

**Priority: Initial Load Time**
- Optimize for time to first meaningful paint
- Lazy load apps that aren't initially visible
- Consider code splitting per app
- Keep bundle size reasonable

**Loading States**
- No skeleton loaders or spinners
- Content should be available instantly
- Apps render immediately with cached/default state

---

## Phase 1 Scope (Core) - COMPLETE

**Included:**
- Desktop shell with menu bar and dock
- Draggable windows (fixed size)
- Window open/close functionality
- Maximize to fill available space (keep chrome)
- Z-index management (click to focus)
- localStorage persistence of window state
- Dock with system icons and open indicators
- Mobile app grid and tab bar
- Cmd+K command menu with app passthrough
- Integration of both apps
- Git history preservation
- Window minimize/restore functionality (moved from Phase 2)

---

## Phase 2 Scope

**URL Backwards Compatibility:** - COMPLETE
- Support direct URLs: `/notes/[slug]`, `/messages`
- On page load, parse URL to determine initial window state:
  - `/notes/reading-list` → open Notes window with that note selected
  - `/messages` → open Messages window
  - `/` → use localStorage state (default behavior)
- Window positions still come from localStorage
- URLs are shareable and bookmarkable
- Existing links continue to work

**Window Resizing:**
- Drag window edges/corners to resize
- Respect minimum window sizes from app config
- Persist window size to localStorage

---

## Phase 3 Scope

**Deferred:**
- Apple menu dropdown ("About This Site")
- Window animations/transitions
- Edge snapping

---

## Migration Considerations

- Refactor both apps to work within window containers
- Ensure keyboard events only go to focused window
- Handle any conflicting dependencies between apps
- Maintain existing functionality throughout migration
- Test mobile responsiveness for both apps
- Verify Supabase connections work in combined project
- Messages sound effects should continue working

---

## Future Extensibility

Adding a new app requires:
1. Creating app components in `/components/apps/[app-name]`
2. Registering in app config with required metadata
3. App automatically appears in dock and is openable as window
4. Implementing mobile layout for tab bar experience

---

## Implementation Plan

### Step 1: Git History Merge

**Goal:** Combine both repositories while preserving full commit history.

1. Create a backup of both repos
2. In `alanagoyal` repo, add `messages` as a remote
3. Fetch messages history: `git fetch messages --no-tags`
4. Create integration branch: `git checkout -b integrate-messages`
5. Merge messages with `--allow-unrelated-histories`
6. Resolve conflicts (move messages files into proper locations)
7. Verify both histories are present with `git log --all --oneline`

**Deliverable:** Single repo with both histories intact.

---

### Step 2: Project Restructure

**Goal:** Reorganize file structure for the combined project.

1. Create directory structure:
   ```
   /components/desktop/
   /components/apps/notes/
   /components/apps/messages/
   /components/mobile/
   /lib/
   /types/
   ```

2. Move Notes components:
   - `/components/*.tsx` → `/components/apps/notes/`
   - Keep `/components/ui/` as shared (both apps use shadcn)

3. Move Messages components:
   - Messages `/components/*.tsx` → `/components/apps/messages/`
   - Messages `/lib/` → `/lib/messages/`
   - Messages `/data/` → `/data/messages/`
   - Messages `/types/` → `/types/messages/`

4. Merge package.json dependencies:
   - Upgrade to Next.js 15 (messages version)
   - Combine all dependencies
   - Resolve version conflicts

5. Merge configuration files:
   - Combine tailwind.config.ts (merge theme extensions)
   - Merge tsconfig.json
   - Update next.config (remove basePath from messages)

6. Move API routes:
   - Messages `/app/api/chat/` → `/app/api/chat/`
   - Messages `/app/api/validate-contact/` → `/app/api/validate-contact/`
   - Keep Notes API routes in place

**Deliverable:** Clean file structure with no duplicates, all imports updated.

---

### Step 3: Types & App Configuration

**Goal:** Define TypeScript types and app registry.

1. Create `/types/window.ts`:
   ```typescript
   interface WindowState {
     id: string;
     appId: string;
     isOpen: boolean;
     isMaximized: boolean;
     position: { x: number; y: number };
     zIndex: number;
   }
   ```

2. Create `/types/apps.ts`:
   ```typescript
   interface AppConfig {
     id: string;
     name: string;
     icon: string;
     description: string;
     accentColor: string;
     defaultPosition: { x: number; y: number };
     defaultSize: { width: number; height: number };
     minSize: { width: number; height: number };
     menuBarTitle: string;
   }
   ```

3. Create `/lib/app-config.ts`:
   - Define Notes app config
   - Define Messages app config
   - Export `APPS` array and helper functions

**Deliverable:** Type-safe app configuration system.

---

### Step 4: Window Manager Context

**Goal:** Implement React Context for window state management.

1. Create `/lib/window-context.tsx`:
   - Define WindowManagerState type
   - Define actions: OPEN_WINDOW, CLOSE_WINDOW, FOCUS_WINDOW, MOVE_WINDOW, MAXIMIZE_WINDOW, RESTORE_WINDOW
   - Implement reducer function
   - Create context provider with localStorage sync
   - Export useWindowManager hook

2. Implement localStorage persistence:
   - Save on every state change
   - Load on initial mount
   - Handle corrupted/missing data with defaults

3. Default state:
   - Notes window open, centered
   - Messages window closed
   - z-index starts at 1

**Deliverable:** Fully functional window state management with persistence.

---

### Step 5: Desktop Shell Components

**Goal:** Build the macOS-like desktop chrome.

1. Create `/components/desktop/menu-bar.tsx`:
   - Apple logo (static, no dropdown in Phase 1)
   - Focused app name
   - Date/time display (updates every minute)

2. Create `/components/desktop/dock.tsx`:
   - Render app icons from config
   - Open indicator dots
   - Hover effect
   - Click handler: open or focus window

3. Create `/components/desktop/window.tsx`:
   - Title bar with traffic lights (close, maximize only)
   - Draggable via title bar (use react-draggable or custom)
   - Click to focus (z-index update)
   - Maximize fills available space
   - Fixed size (no resize handles)
   - Render app content as children

4. Create `/components/desktop/desktop.tsx`:
   - Gradient background
   - Compose MenuBar + windows + Dock
   - Wrap in WindowManagerProvider

**Deliverable:** Complete desktop UI shell.

---

### Step 6: Integrate Notes App

**Goal:** Make Notes work inside a window.

1. Create `/components/apps/notes/notes-app.tsx`:
   - Wrapper component for notes functionality
   - Remove any route-based logic
   - Keep SessionNotesProvider
   - Adapt sidebar + content layout for window container

2. Update Notes components:
   - Remove page-level layout assumptions
   - Ensure components fit within fixed window size
   - Keyboard events only fire when window focused

3. Update Supabase configuration:
   - Ensure env variables work in new structure
   - Test CRUD operations still work

4. Handle command menu:
   - Notes Cmd+K should work when Notes window focused
   - Pass through from global menu

**Deliverable:** Fully functional Notes app in window.

---

### Step 7: Integrate Messages App

**Goal:** Make Messages work inside a window.

1. Create `/components/apps/messages/messages-app.tsx`:
   - Wrapper component for messages functionality
   - Keep all localStorage logic
   - Keep MessageQueue and sound effects
   - Adapt layout for window container

2. Update Messages components:
   - Remove basePath assumptions
   - Ensure components fit within fixed window size
   - Keyboard events only fire when window focused

3. Move Messages assets:
   - `/public/reactions/` stays
   - `/public/sound-effects/` stays
   - `/public/typing-bubbles/` stays

4. Handle command menu:
   - Messages Cmd+K should work when Messages window focused
   - Pass through from global menu

**Deliverable:** Fully functional Messages app in window.

---

### Step 8: Global Command Menu

**Goal:** Unified Cmd+K experience.

1. Update command menu to be context-aware:
   - Detect focused window
   - Load commands from focused app
   - Add minimal desktop commands:
     - Toggle theme
     - Close focused window
     - Open [app name]

2. Prevent conflicts:
   - Only one Cmd+K listener active
   - Desktop captures, then delegates to app

**Deliverable:** Seamless command menu experience.

---

### Step 9: Mobile Experience

**Goal:** iOS-style app grid and navigation.

1. Create `/components/mobile/app-grid.tsx`:
   - Grid of app icons
   - Tap to open app
   - Store last used app in localStorage

2. Create `/components/mobile/tab-bar.tsx`:
   - Fixed bottom navigation
   - App icons
   - Active indicator
   - Switch between apps

3. Create `/components/mobile/mobile-shell.tsx`:
   - Compose app-grid or active app + tab-bar
   - Handle transitions between apps

4. Update main page:
   - Detect viewport width
   - Render Desktop or Mobile shell

5. Ensure apps work fullscreen:
   - Notes already mobile-responsive
   - Messages already mobile-responsive
   - Just need to render without window chrome

**Deliverable:** Complete mobile experience.

---

### Step 10: Polish & Testing

**Goal:** Production-ready quality.

1. Performance optimization:
   - Lazy load Messages app code
   - Ensure fast initial paint
   - Test bundle size

2. Cross-browser testing:
   - Chrome, Safari, Firefox
   - Test on actual mobile devices

3. Edge case handling:
   - Window dragged off-screen
   - localStorage quota exceeded
   - API errors

4. Final cleanup:
   - Remove unused code
   - Ensure consistent code style
   - Update README

**Deliverable:** Production-ready deployment.

---

### Step 11: Deployment

**Goal:** Live on alanagoyal.com.

1. Update Vercel configuration:
   - Ensure build works
   - Set environment variables

2. Deploy and verify:
   - Desktop experience works
   - Mobile experience works
   - Both apps function correctly
   - Supabase connections work
   - AI chat works

**Deliverable:** Live site at alanagoyal.com.
