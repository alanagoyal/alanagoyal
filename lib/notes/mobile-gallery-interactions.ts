export const MOBILE_NOTE_LONG_PRESS_DELAY_MS = 550;
export const MOBILE_NOTE_LONG_PRESS_MOVE_TOLERANCE = 10;

interface PointerCoordinates {
  x: number;
  y: number;
}

export function canStartMobileNoteLongPress(pointerType: string): boolean {
  return pointerType === "touch" || pointerType === "pen";
}

export function didMobileNoteLongPressMove(
  origin: PointerCoordinates,
  current: PointerCoordinates,
): boolean {
  return (
    Math.abs(current.x - origin.x) >
      MOBILE_NOTE_LONG_PRESS_MOVE_TOLERANCE ||
    Math.abs(current.y - origin.y) >
      MOBILE_NOTE_LONG_PRESS_MOVE_TOLERANCE
  );
}

export function isContextMenuKeyboardShortcut(
  key: string,
  shiftKey: boolean,
): boolean {
  return key === "ContextMenu" || (key === "F10" && shiftKey);
}
