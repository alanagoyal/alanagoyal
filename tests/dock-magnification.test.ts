import assert from "node:assert/strict";
import test from "node:test";
import { getDockMagnificationScales } from "../lib/desktop/dock-magnification";

test("magnification is centered on resting slots and independent of previous frames", () => {
  const items = [{ id: "a", width: 48 }, { id: "b", width: 48 }];
  const scales = getDockMagnificationScales(items, 4, -26, 48);
  assert.equal(scales.a, 1.4);
  assert.ok(scales.b > 1 && scales.b < scales.a);
  getDockMagnificationScales(items, 4, 26, 48);
  assert.deepEqual(getDockMagnificationScales(items, 4, -26, 48), scales);
  assert.equal(getDockMagnificationScales(items, 4, 26, 48).b, scales.a);
});

test("divider and variable-width thumbnails contribute to resting layout", () => {
  const items = [
    { id: "app", width: 48 },
    { id: "divider", width: 22, magnifies: false },
    { id: "thumbnail", width: 86 },
    { id: "trash", width: 48 },
  ];
  // Total width 216; thumbnail center = -108 + 48 + 4 + 22 + 4 + 43.
  const scales = getDockMagnificationScales(items, 4, 13, 48);
  assert.equal(scales.thumbnail, 1.4);
  assert.equal(scales.divider, undefined);
  const far = getDockMagnificationScales(items, 4, 10000, 48);
  assert.deepEqual(far, { app: 1, thumbnail: 1, trash: 1 });
});
