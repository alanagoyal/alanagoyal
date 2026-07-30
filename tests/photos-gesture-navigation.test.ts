import assert from "node:assert/strict";
import test from "node:test";

import {
  getPhotoGestureOffset,
  getPhotoSlideTransform,
  shouldCommitTouchPhotoSwipe,
} from "../lib/photos/photo-transition";
import {
  createPhotoWheelGestureState,
  handlePhotoWheelGesture,
  PHOTO_WHEEL_GESTURE_IDLE_MS,
  type PhotoWheelEventLike,
  type PhotoWheelGestureResult,
} from "../lib/photos/wheel-navigation";

function wheel(
  deltaX: number,
  timeStamp: number,
  overrides: Partial<PhotoWheelEventLike> = {},
): PhotoWheelEventLike {
  return { deltaX, deltaY: 0, timeStamp, ...overrides };
}

function runWheelGesture(
  events: PhotoWheelEventLike[],
): PhotoWheelGestureResult[] {
  let state = createPhotoWheelGestureState();

  return events.map((event) => {
    const result = handlePhotoWheelGesture(state, event);
    state = result.state;
    return result;
  });
}

test("leaves vertical scrolling and trackpad pinch gestures native", () => {
  const initialState = createPhotoWheelGestureState();

  for (const event of [
    wheel(8, 0, { deltaY: 40 }),
    wheel(80, 0, { ctrlKey: true }),
  ]) {
    const result = handlePhotoWheelGesture(initialState, event);
    assert.equal(result.captured, false);
    assert.equal(result.navigation, null);
    assert.deepEqual(result.state, initialState);
  }
});

test("navigates once per deliberate gesture and consumes momentum", () => {
  const results = runWheelGesture([
    wheel(50, 0, { deltaY: 2 }),
    wheel(40, 16, { deltaY: 1 }),
    wheel(30, 32, { deltaY: 1 }),
    wheel(3, 48, { deltaY: 60 }),
    wheel(90, 64),
    wheel(55, 80),
  ]);

  assert.deepEqual(
    results.map(({ captured, navigation, gestureDeltaX }) => ({
      captured,
      navigation,
      gestureDeltaX,
    })),
    [
      { captured: true, navigation: null, gestureDeltaX: 50 },
      { captured: true, navigation: null, gestureDeltaX: 90 },
      { captured: true, navigation: "next", gestureDeltaX: 0 },
      { captured: true, navigation: null, gestureDeltaX: 0 },
      { captured: true, navigation: null, gestureDeltaX: 0 },
      { captured: true, navigation: null, gestureDeltaX: 0 },
    ],
  );
});

test("resets unfinished gestures after a reversal or idle window", () => {
  const reversal = runWheelGesture([
    wheel(70, 0),
    wheel(-60, 16),
    wheel(-60, 32),
  ]);
  assert.equal(reversal[1].gestureDeltaX, -60);
  assert.equal(reversal[2].navigation, "previous");

  const afterIdle = runWheelGesture([
    wheel(80, 0),
    wheel(50, PHOTO_WHEEL_GESTURE_IDLE_MS),
  ]);
  assert.equal(afterIdle[1].navigation, null);
  assert.equal(afterIdle[1].gestureDeltaX, 50);
});

test("supports deliberate reversals and repeated same-direction swipes", () => {
  const reversal = runWheelGesture([
    wheel(120, 0),
    wheel(-60, 16),
    wheel(-60, 32),
  ]);
  assert.deepEqual(
    reversal.map((result) => result.navigation),
    ["next", null, "previous"],
  );

  const repeated = runWheelGesture([
    wheel(120, 0),
    wheel(3, 50),
    wheel(3, 140),
    wheel(60, 230),
    wheel(60, 246),
  ]);
  assert.deepEqual(
    repeated.map((result) => result.navigation),
    ["next", null, null, null, "next"],
  );
  assert.equal(repeated[3].gestureDeltaX, 60);
});

test("normalizes discrete wheel deltas as independent gestures", () => {
  const results = runWheelGesture([
    wheel(8, 0, { deltaMode: 1 }),
    wheel(8, 16, { deltaMode: 1 }),
    wheel(-1, 32, { deltaMode: 2 }),
  ]);

  assert.deepEqual(
    results.map((result) => result.navigation),
    ["next", "next", "previous"],
  );
});

test("positions the previous, current, and next photo slides", () => {
  const expectations: Array<[number, string]> = [
    [
      -1,
      "translate3d(calc(-100% - 16px + var(--photo-drag-x)), 0, 0)",
    ],
    [0, "translate3d(var(--photo-drag-x), 0, 0)"],
    [
      1,
      "translate3d(calc(100% + 16px + var(--photo-drag-x)), 0, 0)",
    ],
  ];

  for (const [index, transform] of expectations) {
    assert.equal(getPhotoSlideTransform(index), transform);
  }
});

test("limits gesture tracking and resists photo boundaries", () => {
  const offset = (
    deltaX: number,
    source: "touch" | "wheel",
    canGoPrevious = true,
    canGoNext = true,
  ) =>
    getPhotoGestureOffset({
      deltaX,
      viewportWidth: 600,
      canGoPrevious,
      canGoNext,
      source,
    });

  assert.ok(Math.abs(offset(100, "wheel") - 55) < Number.EPSILON * 100);
  assert.equal(offset(-400, "touch"), -270);
  assert.equal(offset(200, "touch", false), 24);
  assert.equal(offset(-50, "wheel", true, false), -9);
});

test("commits touch swipes by distance or a shorter fast flick", () => {
  const shouldCommit = (
    distance: number,
    velocity: number,
    viewportWidth = 320,
  ) =>
    shouldCommitTouchPhotoSwipe({ distance, velocity, viewportWidth });

  assert.equal(shouldCommit(71, 0.49), false);
  assert.equal(shouldCommit(72, 0), true);
  assert.equal(shouldCommit(36, 0.5, 1000), true);
  assert.equal(shouldCommit(35, 10, 1000), false);
  assert.equal(shouldCommit(119, 0, 1000), false);
  assert.equal(shouldCommit(120, 0, 1000), true);
});
