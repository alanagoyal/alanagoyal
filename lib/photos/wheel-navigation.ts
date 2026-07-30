export const PHOTO_WHEEL_NAVIGATION_THRESHOLD = 50;
export const PHOTO_WHEEL_GESTURE_IDLE_MS = 180;

const WHEEL_DELTA_LINE = 1;
const WHEEL_DELTA_PAGE = 2;
const WHEEL_LINE_HEIGHT_PX = 16;

export interface PhotoWheelGestureState {
  accumulatedDeltaX: number;
  isActive: boolean;
  hasNavigated: boolean;
}

export interface PhotoWheelEventLike {
  deltaX: number;
  deltaY: number;
  deltaMode?: number;
  ctrlKey?: boolean;
  cancelable: boolean;
  preventDefault: () => void;
}

interface PhotoWheelNavigationCallbacks {
  onPrevious: () => void;
  onNext: () => void;
}

export interface PhotoWheelGestureResult {
  state: PhotoWheelGestureState;
  captured: boolean;
}

export function createPhotoWheelGestureState(): PhotoWheelGestureState {
  return {
    accumulatedDeltaX: 0,
    isActive: false,
    hasNavigated: false,
  };
}

function normalizeWheelDelta(delta: number, deltaMode = 0): number {
  if (deltaMode === WHEEL_DELTA_LINE) {
    return delta * WHEEL_LINE_HEIGHT_PX;
  }

  if (deltaMode === WHEEL_DELTA_PAGE) {
    return delta * PHOTO_WHEEL_NAVIGATION_THRESHOLD;
  }

  return delta;
}

export function handlePhotoWheelGesture(
  state: PhotoWheelGestureState,
  event: PhotoWheelEventLike,
  callbacks: PhotoWheelNavigationCallbacks,
): PhotoWheelGestureResult {
  if (event.ctrlKey) {
    return { state, captured: false };
  }

  const deltaX = normalizeWheelDelta(event.deltaX, event.deltaMode);
  const deltaY = normalizeWheelDelta(event.deltaY, event.deltaMode);
  const isHorizontalGesture =
    deltaX !== 0 && Math.abs(deltaX) > Math.abs(deltaY);

  if (!state.isActive && !isHorizontalGesture) {
    return { state, captured: false };
  }

  if (event.cancelable) {
    event.preventDefault();
  }

  if (state.hasNavigated || deltaX === 0) {
    return { state, captured: true };
  }

  const changedDirection =
    state.accumulatedDeltaX !== 0 &&
    Math.sign(state.accumulatedDeltaX) !== Math.sign(deltaX);
  const accumulatedDeltaX = changedDirection
    ? deltaX
    : state.accumulatedDeltaX + deltaX;

  if (Math.abs(accumulatedDeltaX) < PHOTO_WHEEL_NAVIGATION_THRESHOLD) {
    return {
      state: {
        accumulatedDeltaX,
        isActive: true,
        hasNavigated: false,
      },
      captured: true,
    };
  }

  if (accumulatedDeltaX > 0) {
    callbacks.onNext();
  } else {
    callbacks.onPrevious();
  }

  return {
    state: {
      accumulatedDeltaX: 0,
      isActive: true,
      hasNavigated: true,
    },
    captured: true,
  };
}
