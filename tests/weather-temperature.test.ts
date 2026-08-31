import assert from "node:assert/strict";
import test from "node:test";

import {
  convertWeatherTemperature,
  formatWeatherTemperature,
} from "../lib/weather";

test("converts Fahrenheit weather data to Celsius", () => {
  assert.equal(convertWeatherTemperature(32, "celsius"), 0);
  assert.equal(convertWeatherTemperature(68, "celsius"), 20);
  assert.equal(convertWeatherTemperature(68, "fahrenheit"), 68);
});

test("formats weather temperatures with native whole-degree labels", () => {
  assert.equal(formatWeatherTemperature(58, "fahrenheit"), "58°");
  assert.equal(formatWeatherTemperature(58, "celsius"), "14°");
});
