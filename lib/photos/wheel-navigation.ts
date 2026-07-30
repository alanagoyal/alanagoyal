export const PHOTO_WHEEL_NAVIGATION_THRESHOLD = 120;
export const PHOTO_WHEEL_GESTURE_IDLE_MS = 180;

const WHEEL_DELTA_LINE = 1;
const WHEEL_DELTA_PAGE = 2;
const WHEEL_LINE_HEIGHT_PX = 16;
const PHOTO_WHEEL_START_MIN_DELTA = 2;
const PHOTO_WHEEL_RESTART_MIN_DELTA = 8;
const PHOTO_WHEEL_RESTART_ACCELERATION_RATIO = 1.75;
const PHOTO_WHEEL_RESTART_MIN_INCREASE = 4;
const PHOTO_WHEEL_RESTART_LOW_WATER_MAX_DELTA = 4;
const PHOTO_WHEEL_RESTART_DELAY_MS = 220;

type PhotoWheelGesturePhase = "idle" | "tracking" | "locked";
type PhotoWheelDirection = -1 | 0 | 1;

export interface PhotoWheelGestureState {
  phase: PhotoWheelGesturePhase;
  accumulatedDeltaX: number;
  navigationDirection: PhotoWheelDirection;
  navigationTime: number | null;
  lastEventTime: number | null;
  lastDeltaMagnitude: number;
  minimumDeltaMagnitude: number;
  hasDecelerated: boolean;
  restartDeltaX: number;
}

export interface PhotoWheelEventLike {
  deltaX: number;
  deltaY: number;
  deltaMode?: number;
  ctrlKey?: boolean;
  cancelable: boolean;
  timeStamp: number;
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
    phase: "idle",
    accumulatedDeltaX: 0,
    navigationDirection: 0,
    navigationTime: null,
    lastEventTime: null,
    lastDeltaMagnitude: 0,
    minimumDeltaMagnitude: 0,
    hasDecelerated: false,
    restartDeltaX: 0,
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

function getDirection(delta: number): PhotoWheelDirection {
  if (delta > 0) return 1;
  if (delta < 0) return -1;
  return 0;
}

function getUpdatedLowWaterMagnitude(
  state: PhotoWheelGestureState,
  deltaMagnitude: number,
): number {
  if (!state.hasDecelerated) {
    return deltaMagnitude;
  }

  return Math.min(state.minimumDeltaMagnitude, deltaMagnitude);
}

function navigate(
  deltaX: number,
  eventTime: number,
  eventMagnitude: number,
  callbacks: PhotoWheelNavigationCallbacks,
): PhotoWheelGestureState {
  if (deltaX > 0) {
    callbacks.onNext();
  } else {
    callbacks.onPrevious();
  }

  return {
    phase: "locked",
    accumulatedDeltaX: 0,
    navigationDirection: getDirection(deltaX),
    navigationTime: eventTime,
    lastEventTime: eventTime,
    lastDeltaMagnitude: eventMagnitude,
    minimumDeltaMagnitude: eventMagnitude,
    hasDecelerated: false,
    restartDeltaX: 0,
  };
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
  const eventTime = event.timeStamp;
  const isDiscreteWheelEvent =
    event.deltaMode === WHEEL_DELTA_LINE ||
    event.deltaMode === WHEEL_DELTA_PAGE;
  const idleGap =
    state.lastEventTime !== null &&
    eventTime - state.lastEventTime >= PHOTO_WHEEL_GESTURE_IDLE_MS;
  const currentState =
    idleGap || (isDiscreteWheelEvent && state.phase === "locked")
    ? createPhotoWheelGestureState()
    : state;
  const isHorizontalGesture =
    Math.abs(deltaX) >= PHOTO_WHEEL_START_MIN_DELTA &&
    Math.abs(deltaX) > Math.abs(deltaY);

  if (currentState.phase === "idle" && !isHorizontalGesture) {
    return { state: currentState, captured: false };
  }

  if (event.cancelable) {
    event.preventDefault();
  }

  const deltaMagnitude = Math.abs(deltaX);

  if (currentState.phase === "locked" && !isHorizontalGesture) {
    return {
      state: {
        ...currentState,
        lastEventTime: eventTime,
        lastDeltaMagnitude: deltaMagnitude,
        minimumDeltaMagnitude: getUpdatedLowWaterMagnitude(
          currentState,
          deltaMagnitude,
        ),
        hasDecelerated:
          currentState.hasDecelerated ||
          deltaMagnitude < currentState.lastDeltaMagnitude,
        restartDeltaX: 0,
      },
      captured: true,
    };
  }

  if (deltaX === 0) {
    return {
      state: {
        ...currentState,
        phase:
          currentState.phase === "idle" ? "tracking" : currentState.phase,
        lastEventTime: eventTime,
        lastDeltaMagnitude: 0,
        minimumDeltaMagnitude: 0,
        hasDecelerated:
          currentState.phase === "locked" ||
          currentState.hasDecelerated,
        restartDeltaX: 0,
      },
      captured: true,
    };
  }

  if (currentState.phase !== "locked") {
    const changedDirection =
      currentState.accumulatedDeltaX !== 0 &&
      Math.sign(currentState.accumulatedDeltaX) !== Math.sign(deltaX);
    const accumulatedDeltaX = changedDirection
      ? deltaX
      : currentState.accumulatedDeltaX + deltaX;

    if (Math.abs(accumulatedDeltaX) >= PHOTO_WHEEL_NAVIGATION_THRESHOLD) {
      return {
        state: navigate(
          accumulatedDeltaX,
          eventTime,
          deltaMagnitude,
          callbacks,
        ),
        captured: true,
      };
    }

    return {
      state: {
        ...currentState,
        phase: "tracking",
        accumulatedDeltaX,
        lastEventTime: eventTime,
        lastDeltaMagnitude: deltaMagnitude,
      },
      captured: true,
    };
  }

  const direction = getDirection(deltaX);
  const restartDirection = getDirection(currentState.restartDeltaX);
  const isContinuingRestart =
    restartDirection !== 0 && restartDirection === direction;

  if (isContinuingRestart) {
    const restartDeltaX = currentState.restartDeltaX + deltaX;

    if (Math.abs(restartDeltaX) >= PHOTO_WHEEL_NAVIGATION_THRESHOLD) {
      return {
        state: navigate(
          restartDeltaX,
          eventTime,
          deltaMagnitude,
          callbacks,
        ),
        captured: true,
      };
    }

    return {
      state: {
        ...currentState,
        lastEventTime: eventTime,
        lastDeltaMagnitude: deltaMagnitude,
        restartDeltaX,
      },
      captured: true,
    };
  }

  const isOppositeDirection =
    direction !== currentState.navigationDirection;
  const isRenewedSameDirectionImpulse =
    currentState.hasDecelerated &&
    currentState.navigationTime !== null &&
    eventTime - currentState.navigationTime >=
      PHOTO_WHEEL_RESTART_DELAY_MS &&
    currentState.minimumDeltaMagnitude <=
      PHOTO_WHEEL_RESTART_LOW_WATER_MAX_DELTA &&
    deltaMagnitude >= PHOTO_WHEEL_RESTART_MIN_DELTA &&
    deltaMagnitude >=
      currentState.minimumDeltaMagnitude *
        PHOTO_WHEEL_RESTART_ACCELERATION_RATIO &&
    deltaMagnitude - currentState.minimumDeltaMagnitude >=
      PHOTO_WHEEL_RESTART_MIN_INCREASE;
  const canStartRestart =
    deltaMagnitude >= PHOTO_WHEEL_RESTART_MIN_DELTA &&
    (isOppositeDirection || isRenewedSameDirectionImpulse);

  if (canStartRestart) {
    if (deltaMagnitude >= PHOTO_WHEEL_NAVIGATION_THRESHOLD) {
      return {
        state: navigate(deltaX, eventTime, deltaMagnitude, callbacks),
        captured: true,
      };
    }

    return {
      state: {
        ...currentState,
        lastEventTime: eventTime,
        lastDeltaMagnitude: deltaMagnitude,
        restartDeltaX: deltaX,
      },
      captured: true,
    };
  }

  return {
    state: {
      ...currentState,
      lastEventTime: eventTime,
      lastDeltaMagnitude: deltaMagnitude,
      minimumDeltaMagnitude: getUpdatedLowWaterMagnitude(
        currentState,
        deltaMagnitude,
      ),
      hasDecelerated:
        currentState.hasDecelerated ||
        deltaMagnitude < currentState.lastDeltaMagnitude,
      restartDeltaX: 0,
    },
    captured: true,
  };
}
