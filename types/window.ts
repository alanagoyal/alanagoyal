export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WindowState {
  id: string;
  appId: string;
  instanceId?: string; // For multi-window apps: unique identifier (e.g., file path)
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: Position;
  size: Size;
  zIndex: number;
  metadata?: Record<string, unknown>; // App-specific data (e.g., filePath, content)
}

export interface WindowManagerState {
  windows: Record<string, WindowState>;
  focusedWindowId: string | null;
  nextZIndex: number;
  nextInstanceNumber: Record<string, number>; // Track next instance number per multi-window app
}

export type WindowAction =
  // Single-window app actions (existing)
  | { type: "OPEN_WINDOW"; appId: string }
  | { type: "CLOSE_WINDOW"; appId: string }
  | { type: "FOCUS_WINDOW"; appId: string }
  | { type: "MOVE_WINDOW"; appId: string; position: Position }
  | { type: "RESIZE_WINDOW"; appId: string; size: Size; position?: Position }
  | { type: "MINIMIZE_WINDOW"; appId: string }
  | { type: "MAXIMIZE_WINDOW"; appId: string }
  | { type: "RESTORE_WINDOW"; appId: string }
  | { type: "UNMINIMIZE_WINDOW"; appId: string }
  // Multi-window app actions (new)
  | { type: "OPEN_MULTI_WINDOW"; appId: string; instanceId: string; metadata?: Record<string, unknown> }
  | { type: "CLOSE_MULTI_WINDOW"; windowId: string }
  | { type: "FOCUS_MULTI_WINDOW"; windowId: string }
  | { type: "MOVE_MULTI_WINDOW"; windowId: string; position: Position }
  | { type: "RESIZE_MULTI_WINDOW"; windowId: string; size: Size; position?: Position }
  | { type: "MINIMIZE_MULTI_WINDOW"; windowId: string }
  | { type: "MAXIMIZE_MULTI_WINDOW"; windowId: string }
  | { type: "RESTORE_MULTI_WINDOW"; windowId: string }
  | { type: "UNMINIMIZE_MULTI_WINDOW"; windowId: string }
  | { type: "BRING_APP_TO_FRONT"; appId: string }
  | { type: "UPDATE_WINDOW_METADATA"; windowId: string; metadata: Record<string, unknown> }
  // State management
  | { type: "RESTORE_STATE"; state: WindowManagerState }
  | { type: "INCREMENT_Z_INDEX" };
