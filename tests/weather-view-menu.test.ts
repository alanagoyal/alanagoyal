import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { WeatherViewMenu } from "../components/desktop/weather-view-menu";

test("Weather View menu presents native temperature unit choices", () => {
  const markup = renderToStaticMarkup(
    createElement(WeatherViewMenu, {
      isOpen: true,
      onClose: () => {},
      temperatureUnit: "celsius",
      onTemperatureUnitChange: () => {},
    })
  );

  assert.match(markup, /aria-label="Weather view options"/);
  assert.match(markup, /role="menuitemradio"/);
  assert.match(markup, /°F/);
  assert.match(markup, /Fahrenheit/);
  assert.match(markup, /°C/);
  assert.match(markup, /Celsius/);
  assert.equal((markup.match(/aria-checked="true"/g) ?? []).length, 1);
  assert.equal((markup.match(/aria-checked="false"/g) ?? []).length, 1);
});
