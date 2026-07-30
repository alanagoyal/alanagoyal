export const PHOTO_WHEEL_NAVIGATION_THRESHOLD = 120;
export const PHOTO_WHEEL_GESTURE_IDLE_MS = 180;

const WHEEL_DELTA_LINE = 1;
const WHEEL_DELTA_PAGE = 2;
const WHEEL_LINE_HEIGHT_PX = 16;
const START_MIN_DELTA = 2;
const RESTART_MIN_DELTA = 8;
const QUIET_TAIL_MAX_DELTA = 4;
const RESTART_DELAY_MS = 220;

type Direction = -1 | 0 | 1;
export type PhotoWheelNavigation = "previous" | "next";

export interface PhotoWheelGestureState {
  accumulatedDeltaX: number;
  navigationDirection: Direction;
  navigationTime: number | null;
  lastEventTime: number | null;
  sawQuietTail: boolean;
}

export interface PhotoWheelEventLike {
  deltaX: number;
  deltaY: number;
  deltaMode?: number;
  ctrlKey?: boolean;
  timeStamp?: number;
}

export interface PhotoWheelGestureResult {
  state: PhotoWheelGestureState;
  captured: boolean;
  navigation: PhotoWheelNavigation | null;
  gestureDeltaX: number;
}

export function createPhotoWheelGestureState(): PhotoWheelGestureState {
  return {
    accumulatedDeltaX: 0,
    navigationDirection: 0,
    navigationTime: null,
    lastEventTime: null,
    sawQuietTail: false,
  };
}

function normalizeDelta(delta: number, mode = 0): number {
  if (mode === WHEEL_DELTA_LINE) return delta * WHEEL_LINE_HEIGHT_PX;
  if (mode === WHEEL_DELTA_PAGE) {
    return delta * PHOTO_WHEEL_NAVIGATION_THRESHOLD;
  }
  return delta;
}

function directionOf(deltaX: number): Direction {
  return deltaX === 0 ? 0 : deltaX > 0 ? 1 : -1;
}

function result(
  state: PhotoWheelGestureState,
  captured: boolean,
  navigation: PhotoWheelNavigation | null = null,
): PhotoWheelGestureResult {
  return {
    state,
    captured,
    navigation,
    gestureDeltaX: state.accumulatedDeltaX,
  };
}

function lock(deltaX: number, time: number): PhotoWheelGestureResult {
  return result(
    {
      accumulatedDeltaX: 0,
      navigationDirection: directionOf(deltaX),
      navigationTime: time,
      lastEventTime: time,
      sawQuietTail: false,
    },
    true,
    deltaX > 0 ? "next" : "previous",
  );
}

export function handlePhotoWheelGesture(
  state: PhotoWheelGestureState,
  event: PhotoWheelEventLike,
): PhotoWheelGestureResult {
  if (event.ctrlKey) return result(state, false);

  const deltaX = normalizeDelta(event.deltaX, event.deltaMode);
  const deltaY = normalizeDelta(event.deltaY, event.deltaMode);
  const time = event.timeStamp ?? state.lastEventTime ?? 0;
  const isDiscrete =
    event.deltaMode === WHEEL_DELTA_LINE ||
    event.deltaMode === WHEEL_DELTA_PAGE;
  const isIdle =
    state.lastEventTime !== null &&
    time - state.lastEventTime >= PHOTO_WHEEL_GESTURE_IDLE_MS;
  const current =
    isIdle || (isDiscrete && state.navigationDirection !== 0)
      ? createPhotoWheelGestureState()
      : state;
  const magnitude = Math.abs(deltaX);
  const isHorizontal =
    magnitude >= START_MIN_DELTA && magnitude > Math.abs(deltaY);

  if (current.lastEventTime === null && !isHorizontal) {
    return result(current, false);
  }

  if (current.navigationDirection === 0) {
    if (!isHorizontal) {
      return result({ ...current, lastEventTime: time }, true);
    }

    const changedDirection =
      current.accumulatedDeltaX !== 0 &&
      directionOf(current.accumulatedDeltaX) !== directionOf(deltaX);
    const accumulatedDeltaX = changedDirection
      ? deltaX
      : current.accumulatedDeltaX + deltaX;

    if (Math.abs(accumulatedDeltaX) >= PHOTO_WHEEL_NAVIGATION_THRESHOLD) {
      return lock(accumulatedDeltaX, time);
    }

    return result(
      { ...current, accumulatedDeltaX, lastEventTime: time },
      true,
    );
  }

  const sawQuietTail =
    current.sawQuietTail || magnitude <= QUIET_TAIL_MAX_DELTA;
  const direction = directionOf(deltaX);
  const candidateDirection = directionOf(current.accumulatedDeltaX);
  const continuesCandidate =
    candidateDirection !== 0 && candidateDirection === direction;
  const canRestartSameDirection =
    sawQuietTail &&
    current.navigationTime !== null &&
    time - current.navigationTime >= RESTART_DELAY_MS;
  const canStartCandidate =
    isHorizontal &&
    magnitude >= RESTART_MIN_DELTA &&
    (direction !== current.navigationDirection || canRestartSameDirection);

  if (!isHorizontal || (!continuesCandidate && !canStartCandidate)) {
    return result(
      { ...current, lastEventTime: time, sawQuietTail },
      true,
    );
  }

  const accumulatedDeltaX = continuesCandidate
    ? current.accumulatedDeltaX + deltaX
    : deltaX;

  if (Math.abs(accumulatedDeltaX) >= PHOTO_WHEEL_NAVIGATION_THRESHOLD) {
    return lock(accumulatedDeltaX, time);
  }

  return result(
    {
      ...current,
      accumulatedDeltaX,
      lastEventTime: time,
      sawQuietTail,
    },
    true,
  );
}
