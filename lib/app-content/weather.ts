"use client";

import type { WeatherCustomCity } from "@/lib/sidebar-persistence";
import { useAppContent } from "@/lib/app-content/use-app-content";

export const FALLBACK_WEATHER_DEFAULT_CITIES: WeatherCustomCity[] = [
  { id: "san-francisco", name: "San Francisco", latitude: 37.78, longitude: -122.42 },
  { id: "seattle", name: "Seattle", latitude: 47.61, longitude: -122.33 },
  { id: "los-angeles", name: "Los Angeles", latitude: 34.05, longitude: -118.24 },
  { id: "new-york", name: "New York", latitude: 40.71, longitude: -74.01 },
  { id: "london", name: "London", latitude: 51.51, longitude: -0.13 },
  { id: "paris", name: "Paris", latitude: 48.86, longitude: 2.35 },
];

function isWeatherCity(value: unknown): value is WeatherCustomCity {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WeatherCustomCity>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number"
  );
}

function decodeWeatherCities(payload: unknown): WeatherCustomCity[] | null {
  if (!Array.isArray(payload) || !payload.every(isWeatherCity)) {
    return null;
  }
  return payload;
}

export function useWeatherDefaultCities(): WeatherCustomCity[] {
  return useAppContent({
    key: "weather.default_cities",
    fallback: FALLBACK_WEATHER_DEFAULT_CITIES,
    decode: decodeWeatherCities,
  });
}
