import assert from "node:assert/strict";
import test from "node:test";
import { formatDuration, formatTotalDuration } from "../../lib/music/utils";

test("formatDuration returns mm:ss with zero-padded seconds", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(65), "1:05");
  assert.equal(formatDuration(3599), "59:59");
});

test("formatTotalDuration returns minutes for sub-hour values", () => {
  assert.equal(formatTotalDuration(59), "0 min");
  assert.equal(formatTotalDuration(125), "2 min");
});

test("formatTotalDuration returns hours and minutes for hour+ values", () => {
  assert.equal(formatTotalDuration(3600), "1 hr 0 min");
  assert.equal(formatTotalDuration(3661), "1 hr 1 min");
});
