import assert from "node:assert/strict";
import test from "node:test";

import {
  createPhotoWheelGestureState,
  handlePhotoWheelGesture,
} from "../lib/photos/wheel-navigation";

function createWheelEvent({
  deltaX,
  deltaY,
  deltaMode = 0,
  ctrlKey = false,
}: {
  deltaX: number;
  deltaY: number;
  deltaMode?: number;
  ctrlKey?: boolean;
}) {
  let defaultPrevented = false;

  return {
    event: {
      deltaX,
      deltaY,
      deltaMode,
      ctrlKey,
      cancelable: true,
      preventDefault: () => {
        defaultPrevented = true;
      },
    },
    wasDefaultPrevented: () => defaultPrevented,
  };
}

test("horizontal wheel gestures navigate once and consume momentum", () => {
  let previousCount = 0;
  let nextCount = 0;
  const callbacks = {
    onPrevious: () => {
      previousCount += 1;
    },
    onNext: () => {
      nextCount += 1;
    },
  };
  let state = createPhotoWheelGestureState();

  const start = createWheelEvent({ deltaX: 30, deltaY: 2 });
  const startResult = handlePhotoWheelGesture(state, start.event, callbacks);
  state = startResult.state;

  assert.equal(startResult.captured, true);
  assert.equal(start.wasDefaultPrevented(), true);
  assert.equal(nextCount, 0);

  const threshold = createWheelEvent({ deltaX: 25, deltaY: 1 });
  const thresholdResult = handlePhotoWheelGesture(
    state,
    threshold.event,
    callbacks,
  );
  state = thresholdResult.state;

  assert.equal(threshold.wasDefaultPrevented(), true);
  assert.equal(nextCount, 1);

  const diagonalTail = createWheelEvent({ deltaX: 4, deltaY: 60 });
  const diagonalTailResult = handlePhotoWheelGesture(
    state,
    diagonalTail.event,
    callbacks,
  );
  state = diagonalTailResult.state;

  assert.equal(diagonalTailResult.captured, true);
  assert.equal(diagonalTail.wasDefaultPrevented(), true);
  assert.equal(nextCount, 1);

  const momentum = createWheelEvent({ deltaX: 120, deltaY: 0 });
  const momentumResult = handlePhotoWheelGesture(
    state,
    momentum.event,
    callbacks,
  );

  assert.equal(momentumResult.captured, true);
  assert.equal(momentum.wasDefaultPrevented(), true);
  assert.equal(nextCount, 1);
  assert.equal(previousCount, 0);
});

test("negative horizontal wheel gestures navigate to the previous photo", () => {
  let previousCount = 0;
  const event = createWheelEvent({ deltaX: -60, deltaY: 3 });

  const result = handlePhotoWheelGesture(
    createPhotoWheelGestureState(),
    event.event,
    {
      onPrevious: () => {
        previousCount += 1;
      },
      onNext: () => assert.fail("should not navigate forward"),
    },
  );

  assert.equal(result.captured, true);
  assert.equal(event.wasDefaultPrevented(), true);
  assert.equal(previousCount, 1);
});

test("vertical scrolling and trackpad pinch gestures remain native", () => {
  const callbacks = {
    onPrevious: () => assert.fail("should not navigate backward"),
    onNext: () => assert.fail("should not navigate forward"),
  };
  const vertical = createWheelEvent({ deltaX: 8, deltaY: 40 });
  const verticalResult = handlePhotoWheelGesture(
    createPhotoWheelGestureState(),
    vertical.event,
    callbacks,
  );

  assert.equal(verticalResult.captured, false);
  assert.equal(vertical.wasDefaultPrevented(), false);

  const pinch = createWheelEvent({
    deltaX: 80,
    deltaY: 0,
    ctrlKey: true,
  });
  const pinchResult = handlePhotoWheelGesture(
    createPhotoWheelGestureState(),
    pinch.event,
    callbacks,
  );

  assert.equal(pinchResult.captured, false);
  assert.equal(pinch.wasDefaultPrevented(), false);
});
