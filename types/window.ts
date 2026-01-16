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
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: Position;
  size: Size;
  zIndex: number;
}

export interface WindowManagerState {
  windows: Record<string, WindowState>;
  focusedWindowId: string | null;
  nextZIndex: number;
}

export type WindowAction =
  | { type: "OPEN_WINDOW"; appId: string }
  | { type: "CLOSE_WINDOW"; appId: string }
  | { type: "FOCUS_WINDOW"; appId: string }
  | { type: "MOVE_WINDOW"; appId: string; position: Position }
  | { type: "RESIZE_WINDOW"; appId: string; size: Size; position?: Position }
  | { type: "MINIMIZE_WINDOW"; appId: string }
  | { type: "MAXIMIZE_WINDOW"; appId: string }
  | { type: "RESTORE_WINDOW"; appId: string }
  | { type: "RESTORE_STATE"; state: WindowManagerState }
  | { type: "INCREMENT_Z_INDEX" };
