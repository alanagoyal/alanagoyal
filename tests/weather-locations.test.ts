import assert from "node:assert/strict";
import test from "node:test";

import { getWeatherCitySelectionAfterRemoval } from "../lib/weather";

const cities = [
  { id: "san-francisco" },
  { id: "seattle" },
  { id: "tokyo" },
];

test("keeps the current Weather selection when another city is removed", () => {
  assert.equal(
    getWeatherCitySelectionAfterRemoval(cities, "tokyo", "seattle"),
    "seattle"
  );
});

test("selects the next Weather city after removing the current city", () => {
  assert.equal(
    getWeatherCitySelectionAfterRemoval(cities, "seattle", "seattle"),
    "tokyo"
  );
});

test("falls back to the previous Weather city at the end of the list", () => {
  assert.equal(
    getWeatherCitySelectionAfterRemoval(cities, "tokyo", "tokyo"),
    "seattle"
  );
});
