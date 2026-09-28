import assert from "node:assert/strict";
import test from "node:test";

import {
  formatWeatherVisibility,
  getUvIndexLabel,
} from "../lib/weather";

test("labels UV index with native category ranges", () => {
  assert.equal(getUvIndexLabel(0), "Low");
  assert.equal(getUvIndexLabel(2.9), "Low");
  assert.equal(getUvIndexLabel(3), "Moderate");
  assert.equal(getUvIndexLabel(5.5), "Moderate");
  assert.equal(getUvIndexLabel(6), "High");
  assert.equal(getUvIndexLabel(7.9), "High");
  assert.equal(getUvIndexLabel(8), "Very High");
  assert.equal(getUvIndexLabel(10.9), "Very High");
  assert.equal(getUvIndexLabel(11), "Extreme");
});

test("formats visibility from meters into native mile labels", () => {
  assert.equal(formatWeatherVisibility(1609.344), "1.0 mi");
  assert.equal(formatWeatherVisibility(12800), "8.0 mi");
  assert.equal(formatWeatherVisibility(16093.44), "10 mi");
  assert.equal(formatWeatherVisibility(40233.6), "25 mi");
});

test("clamps near-zero visibility to a readable minimum", () => {
  assert.equal(formatWeatherVisibility(0), "0.1 mi");
  assert.equal(formatWeatherVisibility(100), "0.1 mi");
});
