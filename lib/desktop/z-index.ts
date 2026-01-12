/**
 * Desktop Z-Index Layering System
 *
 * This defines the stacking order for all desktop UI elements.
 * Lower numbers are further back, higher numbers are in front.
 *
 * Layer hierarchy (back to front):
 * 1. Windows (dynamic, 1-50) - managed by window-context
 * 2. Dock (60) - always above all windows
 * 3. Menu bar (70) - above dock, dropdowns are children at same level
 * 4. Fullscreen windows (80) - cover menu bar and dock
 * 5. Brightness overlay (90) - dims everything below
 * 6. System overlays (100) - lock, sleep, restart, shutdown screens
 */

export const Z_INDEX = {
  // Dynamic window stacking (1-50, managed by window-context normalizer)
  WINDOW_MAX: 50,

  // Fixed UI layers
  DOCK: 60,
  MENU_BAR: 70,
  FULLSCREEN: 80,
  BRIGHTNESS_OVERLAY: 90,
  SYSTEM_OVERLAY: 100,
} as const;

// Tailwind class names for each layer
export const Z_CLASS = {
  DOCK: "z-[60]",
  MENU_BAR: "z-[70]",
  FULLSCREEN: "z-[80]",
  BRIGHTNESS_OVERLAY: "z-[90]",
  SYSTEM_OVERLAY: "z-[100]",
} as const;
