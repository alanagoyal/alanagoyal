import assert from "node:assert/strict";
import test from "node:test";

import {
  EYE_STYLES,
  getEyeStyle,
  nextEyeStyle,
  parseStoredEyeStyle,
  pupilOffset,
} from "../lib/menu-bar-eyes";

test("cycles through every style and returns to the first", () => {
  const seen = [EYE_STYLES[0].id];
  let current = EYE_STYLES[0].id;
  for (let i = 0; i < EYE_STYLES.length - 1; i += 1) {
    current = nextEyeStyle(current);
    seen.push(current);
  }
  assert.deepEqual(seen, EYE_STYLES.map((style) => style.id));
  assert.equal(nextEyeStyle(current), EYE_STYLES[0].id);
});

test("only restores a style it recognises", () => {
  assert.equal(parseStoredEyeStyle("dragon"), "dragon");
  assert.equal(parseStoredEyeStyle("wizard"), null);
  assert.equal(parseStoredEyeStyle(null), null);
  assert.equal(getEyeStyle("googly").id, "googly");
});

test("pupil points at the cursor without leaving the eye", () => {
  const center = { x: 100, y: 100 };

  const far = pupilOffset(center, { x: 400, y: 100 }, 3);
  assert.deepEqual(far, { x: 3, y: 0 });

  const near = pupilOffset(center, { x: 101, y: 100 }, 3);
  assert.deepEqual(near, { x: 1, y: 0 });

  const diagonal = pupilOffset(center, { x: 200, y: 200 }, 10);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 10) < 1e-9);
  assert.ok(Math.abs(diagonal.x - diagonal.y) < 1e-9);
});

test("stays put when there is nowhere to go", () => {
  assert.deepEqual(pupilOffset({ x: 5, y: 5 }, { x: 5, y: 5 }, 4), { x: 0, y: 0 });
  assert.deepEqual(pupilOffset({ x: 5, y: 5 }, { x: 50, y: 5 }, 0), { x: 0, y: 0 });
});
