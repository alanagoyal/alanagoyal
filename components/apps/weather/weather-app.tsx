"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Search,
  Sun,
  Wind,
  X,
} from "lucide-react";
import { WindowNavShell, WindowNavSpacer } from "@/components/window-nav-shell";
import { WindowControls } from "@/components/window-controls";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  buildOpenMeteoForecastUrl,
  getWeatherDescription,
  getWeatherIconName,
  type WeatherMood,
  getWeatherScene,
  type WeatherScene,
} from "@/lib/weather";
import {
  loadWeatherCustomCities,
  loadWeatherDataCache,
  loadWeatherSelectedCity,
  saveWeatherCustomCities,
  saveWeatherDataCache,
  saveWeatherSelectedCity,
  type WeatherDataCache,
  type WeatherCustomCity,
} from "@/lib/sidebar-persistence";
import { useWindowFocus } from "@/lib/window-focus-context";
import { cn } from "@/lib/utils";

interface WeatherAppProps {
  isMobile?: boolean;
  inShell?: boolean;
}

interface OpenMeteoResponse {
  current: {
    time?: string;
    temperature_2m: number;
    weather_code: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
}

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    name: string;
    id?: number;
    country?: string;
    country_code?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
}

interface HourForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationChance: number;
}

interface DailyForecast {
  date: string;
  high: number;
  low: number;
  weatherCode: number;
  precipitationChance: number;
}

interface CityWeather {
  cityId: string;
  cityName: string;
  currentTime: string;
  currentTemp: number;
  weatherCode: number;
  high: number;
  low: number;
  feelsLike: number;
  humidity: number;
  windMph: number;
  hourly: HourForecast[];
  daily: DailyForecast[];
  updatedAt: Date;
}

type CityConfig = WeatherCustomCity;

function restoreWeatherDataFromCache(cache: WeatherDataCache): Record<string, CityWeather> {
  const restored: Record<string, CityWeather> = {};

  for (const [cityId, weather] of Object.entries(cache)) {
    const updatedAt = new Date(weather.updatedAt);
    if (Number.isNaN(updatedAt.getTime())) continue;

    restored[cityId] = {
      cityId: weather.cityId,
      cityName: weather.cityName,
      currentTime: weather.currentTime,
      currentTemp: weather.currentTemp,
      weatherCode: weather.weatherCode,
      high: weather.high,
      low: weather.low,
      feelsLike: weather.feelsLike,
      humidity: weather.humidity,
      windMph: weather.windMph,
      hourly: weather.hourly,
      daily: weather.daily,
      updatedAt,
    };
  }

  return restored;
}

function serializeWeatherDataForCache(weatherByCity: Record<string, CityWeather>): WeatherDataCache {
  const cache: WeatherDataCache = {};

  for (const [cityId, weather] of Object.entries(weatherByCity)) {
    cache[cityId] = {
      cityId: weather.cityId,
      cityName: weather.cityName,
      currentTime: weather.currentTime,
      currentTemp: weather.currentTemp,
      weatherCode: weather.weatherCode,
      high: weather.high,
      low: weather.low,
      feelsLike: weather.feelsLike,
      humidity: weather.humidity,
      windMph: weather.windMph,
      hourly: weather.hourly,
      daily: weather.daily,
      updatedAt: weather.updatedAt.toISOString(),
    };
  }

  return cache;
}

const DEFAULT_CITIES: CityConfig[] = [
  { id: "san-francisco", name: "San Francisco", latitude: 37.78, longitude: -122.42 },
  { id: "seattle", name: "Seattle", latitude: 47.61, longitude: -122.33 },
  { id: "los-angeles", name: "Los Angeles", latitude: 34.05, longitude: -118.24 },
  { id: "new-york", name: "New York", latitude: 40.71, longitude: -74.01 },
  { id: "london", name: "London", latitude: 51.51, longitude: -0.13 },
  { id: "paris", name: "Paris", latitude: 48.86, longitude: 2.35 },
];

const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_FETCH_MAX_RETRIES = 2;
const WEATHER_FETCH_BASE_RETRY_MS = 450;
const WEATHER_FETCH_MAX_RETRY_MS = 5000;
const WEATHER_FETCH_BATCH_SIZE = 3;

type WeatherScenePreviewMode = "auto" | WeatherMood;

const WEATHER_SCENE_PREVIEW_OPTIONS: WeatherScenePreviewMode[] = [
  "auto",
  "clear",
  "cloudy",
  "fog",
  "rain",
  "snow",
  "thunder",
];
const WEATHER_SCENE_PREVIEW_ENABLED = process.env.NODE_ENV !== "production";

const WEATHER_RAIN_DROPS = [
  { left: "4%", top: "-18%", height: 16, duration: 1.2, delay: 0.1, drift: 4, opacity: 0.5 },
  { left: "9%", top: "-8%", height: 18, duration: 1.4, delay: 0.8, drift: 6, opacity: 0.42 },
  { left: "14%", top: "-22%", height: 14, duration: 1.05, delay: 0.2, drift: 5, opacity: 0.58 },
  { left: "18%", top: "-12%", height: 20, duration: 1.35, delay: 1.1, drift: 7, opacity: 0.46 },
  { left: "23%", top: "-26%", height: 15, duration: 1.1, delay: 0.4, drift: 5, opacity: 0.54 },
  { left: "28%", top: "-10%", height: 17, duration: 1.25, delay: 1.4, drift: 6, opacity: 0.44 },
  { left: "33%", top: "-20%", height: 19, duration: 1.45, delay: 0.7, drift: 8, opacity: 0.4 },
  { left: "38%", top: "-14%", height: 13, duration: 0.95, delay: 0.3, drift: 4, opacity: 0.6 },
  { left: "43%", top: "-24%", height: 18, duration: 1.2, delay: 1.6, drift: 6, opacity: 0.48 },
  { left: "48%", top: "-9%", height: 16, duration: 1.15, delay: 0.5, drift: 5, opacity: 0.56 },
  { left: "53%", top: "-19%", height: 21, duration: 1.5, delay: 1.3, drift: 7, opacity: 0.38 },
  { left: "58%", top: "-6%", height: 14, duration: 1.05, delay: 0.9, drift: 4, opacity: 0.58 },
  { left: "63%", top: "-21%", height: 18, duration: 1.25, delay: 0.15, drift: 6, opacity: 0.5 },
  { left: "68%", top: "-13%", height: 15, duration: 1.1, delay: 1.0, drift: 5, opacity: 0.6 },
  { left: "73%", top: "-25%", height: 20, duration: 1.4, delay: 0.55, drift: 7, opacity: 0.42 },
  { left: "78%", top: "-11%", height: 14, duration: 1.0, delay: 1.55, drift: 4, opacity: 0.62 },
  { left: "83%", top: "-23%", height: 17, duration: 1.2, delay: 0.35, drift: 5, opacity: 0.54 },
  { left: "88%", top: "-7%", height: 19, duration: 1.35, delay: 1.25, drift: 7, opacity: 0.44 },
  { left: "93%", top: "-18%", height: 15, duration: 1.1, delay: 0.65, drift: 5, opacity: 0.58 },
] as const;

const WEATHER_SNOW_FLAKES = [
  { left: "6%", top: "-8%", size: 5, duration: 5.8, delay: 0.3, drift: 12, opacity: 0.78 },
  { left: "14%", top: "-18%", size: 6, duration: 6.4, delay: 1.2, drift: 14, opacity: 0.72 },
  { left: "21%", top: "-10%", size: 4, duration: 5.2, delay: 0.7, drift: 10, opacity: 0.82 },
  { left: "29%", top: "-20%", size: 7, duration: 7.1, delay: 1.8, drift: 16, opacity: 0.68 },
  { left: "38%", top: "-14%", size: 5, duration: 6.2, delay: 0.1, drift: 13, opacity: 0.8 },
  { left: "47%", top: "-6%", size: 6, duration: 5.6, delay: 2.1, drift: 11, opacity: 0.74 },
  { left: "55%", top: "-16%", size: 4, duration: 4.9, delay: 1.4, drift: 9, opacity: 0.84 },
  { left: "64%", top: "-12%", size: 7, duration: 7.4, delay: 0.9, drift: 17, opacity: 0.7 },
  { left: "73%", top: "-22%", size: 5, duration: 6.1, delay: 2.6, drift: 12, opacity: 0.78 },
  { left: "82%", top: "-9%", size: 6, duration: 5.4, delay: 1.7, drift: 14, opacity: 0.76 },
  { left: "91%", top: "-18%", size: 4, duration: 4.8, delay: 0.5, drift: 10, opacity: 0.82 },
] as const;

const WEATHER_LIGHTNING_BOLTS = [
  {
    left: "61%",
    top: "10%",
    width: "40px",
    height: "20%",
    delay: "0s",
    clipPath:
      "polygon(48% 0%, 68% 0%, 56% 34%, 72% 34%, 38% 68%, 52% 68%, 28% 100%, 40% 62%, 24% 62%)",
  },
  {
    left: "69%",
    top: "14%",
    width: "32px",
    height: "15%",
    delay: "0.16s",
    clipPath:
      "polygon(44% 0%, 66% 0%, 54% 38%, 72% 38%, 34% 100%, 46% 62%, 26% 62%)",
  },
  {
    left: "74%",
    top: "8%",
    width: "28px",
    height: "12%",
    delay: "2.7s",
    clipPath:
      "polygon(46% 0%, 64% 0%, 54% 34%, 70% 34%, 36% 100%, 46% 64%, 28% 64%)",
  },
] as const;

function getSceneCodeOverride(mood: WeatherScenePreviewMode): number | null {
  if (mood === "clear") return 0;
  if (mood === "cloudy") return 3;
  if (mood === "fog") return 45;
  if (mood === "rain") return 63;
  if (mood === "snow") return 71;
  if (mood === "thunder") return 95;
  return null;
}

function toCityId(name: string, latitude: number, longitude: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${slug}-${Math.round(latitude * 100)}-${Math.round(longitude * 100)}`;
}

function parseCustomCityName(result: NonNullable<OpenMeteoGeocodingResponse["results"]>[number]): string {
  const parts = [result.name, result.admin1, result.country].filter(Boolean);
  const uniqueParts: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (!uniqueParts.includes(part)) {
      uniqueParts.push(part);
    }
  }
  return uniqueParts.join(", ");
}

function getCityCoordinateKey(city: Pick<CityConfig, "latitude" | "longitude">): string {
  return `${city.latitude.toFixed(2)}:${city.longitude.toFixed(2)}`;
}

function findMatchingCity(cities: CityConfig[], target: CityConfig): CityConfig | null {
  const targetKey = getCityCoordinateKey(target);
  return cities.find((city) => getCityCoordinateKey(city) === targetKey) ?? null;
}

async function geocodeCities(query: string): Promise<CityConfig[]> {
  const params = new URLSearchParams({
    name: query,
    count: "8",
    language: "en",
    format: "json",
  });
  const res = await fetch(`${OPEN_METEO_GEOCODING_URL}?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as OpenMeteoGeocodingResponse;
  const seenCoordinates = new Set<string>();
  const results: CityConfig[] = [];

  for (const result of data.results ?? []) {
    const name = parseCustomCityName(result);
    const latitude = result.latitude;
    const longitude = result.longitude;
    const key = getCityCoordinateKey({ latitude, longitude });
    if (seenCoordinates.has(key)) continue;
    seenCoordinates.add(key);

    results.push({
      id: toCityId(name, latitude, longitude),
      name,
      latitude,
      longitude,
    });
  }

  return results;
}

function getSidebarCardBackground(scene: WeatherScene | null): string {
  const baseScene =
    scene?.background ??
    "linear-gradient(180deg, #2e5786 0%, #3f6998 44%, #537cad 100%)";
  const overlays = [
    "linear-gradient(180deg, rgba(8,16,34,0.18) 0%, rgba(8,16,34,0.34) 100%)",
  ];

  if (scene?.showFog) {
    overlays.push(
      "linear-gradient(180deg, rgba(214,229,247,0.08) 40%, rgba(214,229,247,0.2) 100%)"
    );
  }
  if (scene?.showCloudBands) {
    if (scene.mood === "cloudy") {
      overlays.push(
        "radial-gradient(90px 42px at 22% 24%, rgba(255,255,255,0.2), transparent 72%), radial-gradient(120px 52px at 72% 28%, rgba(255,255,255,0.18), transparent 72%), radial-gradient(120px 46px at 48% 84%, rgba(255,255,255,0.12), transparent 72%)"
      );
    } else if (scene.mood === "fog") {
      overlays.push(
        "linear-gradient(180deg, rgba(236,241,247,0.16) 12%, rgba(236,241,247,0.04) 40%, rgba(236,241,247,0.18) 78%, rgba(236,241,247,0.28) 100%)"
      );
    } else {
      overlays.push(
        "linear-gradient(130deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.02) 56%, rgba(255,255,255,0.14) 100%)"
      );
    }
  }
  if (scene?.showRain) {
    overlays.push(
      "radial-gradient(1.2px 6px at 10% 18%, rgba(221,237,255,0.48), transparent 78%), radial-gradient(1.2px 6px at 22% 34%, rgba(221,237,255,0.44), transparent 78%), radial-gradient(1.2px 7px at 36% 16%, rgba(221,237,255,0.5), transparent 78%), radial-gradient(1px 5px at 48% 38%, rgba(221,237,255,0.42), transparent 78%), radial-gradient(1.2px 6px at 62% 22%, rgba(221,237,255,0.46), transparent 78%), radial-gradient(1px 5px at 74% 40%, rgba(221,237,255,0.4), transparent 78%), radial-gradient(1.2px 7px at 88% 20%, rgba(221,237,255,0.5), transparent 78%)"
    );
  }
  if (scene?.showSnow) {
    overlays.push(
      "radial-gradient(3px 3px at 12% 22%, rgba(255,255,255,0.88), transparent 72%), radial-gradient(2.5px 2.5px at 26% 36%, rgba(255,255,255,0.78), transparent 72%), radial-gradient(3px 3px at 42% 18%, rgba(255,255,255,0.9), transparent 72%), radial-gradient(2px 2px at 58% 42%, rgba(255,255,255,0.78), transparent 72%), radial-gradient(3px 3px at 74% 24%, rgba(255,255,255,0.86), transparent 72%), radial-gradient(2.5px 2.5px at 88% 38%, rgba(255,255,255,0.8), transparent 72%)"
    );
  }
  if (scene?.showLightning) {
    overlays.push(
      "radial-gradient(72px 110px at 78% 14%, rgba(244,248,255,0.28), rgba(214,228,255,0.06) 34%, transparent 72%)",
      "linear-gradient(180deg, rgba(5,10,22,0.06) 0%, rgba(5,10,22,0.24) 100%)"
    );
  }
  if (scene?.showStars) {
    overlays.push(
      "radial-gradient(1.6px 1.6px at 12px 18px, rgba(255,255,255,0.78), transparent 60%), radial-gradient(1.3px 1.3px at 58px 32px, rgba(255,255,255,0.68), transparent 60%)"
    );
  }
  if (scene?.showSunGlow) {
    overlays.push(
      "radial-gradient(80px 56px at 82% 14%, rgba(255,217,125,0.22), transparent 70%)"
    );
  }

  overlays.push(baseScene);
  return overlays.join(", ");
}

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  switch (getWeatherIconName(code)) {
    case "sun":
      return <Sun className={className} />;
    case "cloud":
      return <Cloud className={className} />;
    case "fog":
      return <CloudFog className={className} />;
    case "drizzle":
      return <CloudDrizzle className={className} />;
    case "rain":
      return <CloudRain className={className} />;
    case "snow":
      return <CloudSnow className={className} />;
    case "thunder":
      return <CloudLightning className={className} />;
    default:
      return <Cloud className={className} />;
  }
}

function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatHourLabel(iso: string): string {
  const rawHour = Number(iso.split("T")[1]?.slice(0, 2));
  if (!Number.isFinite(rawHour)) return "--";
  if (rawHour === 0) return "12AM";
  if (rawHour === 12) return "12PM";
  return rawHour > 12 ? `${rawHour - 12}PM` : `${rawHour}AM`;
}

function formatCityClock(iso: string): string {
  if (!iso) return "--:--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatUpdatedTime(value: Date): string {
  return value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatWeekday(dateString: string, index: number): string {
  if (index === 0) return "Today";
  return parseDateOnly(dateString).toLocaleDateString("en-US", { weekday: "short" });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, WEATHER_FETCH_MAX_RETRY_MS);
  }

  const retryDate = Date.parse(value);
  if (Number.isFinite(retryDate)) {
    const delay = retryDate - Date.now();
    if (delay > 0) {
      return Math.min(delay, WEATHER_FETCH_MAX_RETRY_MS);
    }
  }

  return null;
}

function getRetryDelayMs(attempt: number): number {
  const exponentialDelay = WEATHER_FETCH_BASE_RETRY_MS * (2 ** attempt);
  const jitter = Math.floor(Math.random() * 180);
  return Math.min(exponentialDelay + jitter, WEATHER_FETCH_MAX_RETRY_MS);
}

function isRetryableWeatherStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function fetchCityWeather(city: CityConfig): Promise<CityWeather> {
  const requestUrl = buildOpenMeteoForecastUrl({
    latitude: city.latitude,
    longitude: city.longitude,
    currentFields: [
      "temperature_2m",
      "weather_code",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
    ],
    dailyFields: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
    ],
    hourlyFields: ["temperature_2m", "weather_code", "precipitation_probability"],
    forecastDays: 10,
  });

  let res: Response | null = null;
  for (let attempt = 0; attempt <= WEATHER_FETCH_MAX_RETRIES; attempt += 1) {
    try {
      res = await fetch(requestUrl);
    } catch {
      if (attempt >= WEATHER_FETCH_MAX_RETRIES) {
        throw new Error(`Weather request failed for ${city.name}: network error`);
      }
      await sleep(getRetryDelayMs(attempt));
      continue;
    }

    if (res.ok) {
      break;
    }

    const shouldRetry = attempt < WEATHER_FETCH_MAX_RETRIES && isRetryableWeatherStatus(res.status);
    if (shouldRetry) {
      const retryAfterDelay = parseRetryAfterMs(res.headers.get("retry-after"));
      await sleep(retryAfterDelay ?? getRetryDelayMs(attempt));
      continue;
    }

    throw new Error(`Weather request failed for ${city.name}: ${res.status}`);
  }

  if (!res || !res.ok) {
    throw new Error(`Weather request failed for ${city.name}: unavailable`);
  }

  const data = (await res.json()) as OpenMeteoResponse;
  const now = Date.now();
  const firstUpcomingHourIndex = data.hourly.time.findIndex(
    (time) => new Date(time).getTime() >= now
  );
  const startHourIndex = firstUpcomingHourIndex === -1 ? 0 : firstUpcomingHourIndex;

  const hourly = data.hourly.time.slice(startHourIndex, startHourIndex + 10).map((time, index) => {
    const sourceIndex = startHourIndex + index;
    return {
      time,
      temperature: data.hourly.temperature_2m[sourceIndex] ?? 0,
      weatherCode: data.hourly.weather_code[sourceIndex] ?? 0,
      precipitationChance: data.hourly.precipitation_probability[sourceIndex] ?? 0,
    };
  });

  const daily = data.daily.time.slice(0, 10).map((date, index) => ({
    date,
    high: data.daily.temperature_2m_max[index] ?? 0,
    low: data.daily.temperature_2m_min[index] ?? 0,
    weatherCode: data.daily.weather_code[index] ?? 0,
    precipitationChance: data.daily.precipitation_probability_max[index] ?? 0,
  }));

  return {
    cityId: city.id,
    cityName: city.name,
    currentTime: data.current.time ?? data.hourly.time[startHourIndex] ?? "",
    currentTemp: data.current.temperature_2m,
    weatherCode: data.current.weather_code,
    high: daily[0]?.high ?? data.current.temperature_2m,
    low: daily[0]?.low ?? data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windMph: data.current.wind_speed_10m,
    hourly,
    daily,
    updatedAt: new Date(),
  };
}

function SidebarCityItem({
  cityName,
  weather,
  scene,
  isSelected,
  isMobileView,
  onSelect,
}: {
  cityName: string;
  weather: CityWeather | null;
  scene: WeatherScene | null;
  isSelected: boolean;
  isMobileView: boolean;
  onSelect: () => void;
}) {
  const isDesktopSelected = isSelected && !isMobileView;
  const timeLabel = weather ? formatCityClock(weather.currentTime) : "--:--";
  const descriptionLabel = weather ? getWeatherDescription(weather.weatherCode) : "Loading...";
  const temperatureLabel = weather ? `${Math.round(weather.currentTemp)}°` : "--";
  const highLowLabel = weather
    ? `H:${Math.round(weather.high)}° L:${Math.round(weather.low)}°`
    : "H:-- L:--";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full max-w-full rounded-lg px-2.5 py-1.5 h-[70px] text-left transition-colors text-white/95 backdrop-blur-sm [text-shadow:0_1px_2px_rgba(6,14,30,0.5)]",
        "bg-white/[0.07]",
        isDesktopSelected &&
          "bg-white/[0.15] shadow-[inset_0_0_0_2px_rgba(138,186,236,0.42),0_0_0_1px_rgba(76,141,209,0.72),0_8px_18px_rgba(7,31,63,0.22)]"
      )}
      style={{
        backgroundImage: getSidebarCardBackground(scene),
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_96px] items-start gap-2">
        <div className="min-w-0">
          <p className="truncate whitespace-nowrap text-base font-medium">{cityName}</p>
          <p
            className={cn(
              "text-xs",
              isDesktopSelected ? "text-white/90" : "text-white/76"
            )}
          >
            {timeLabel}
          </p>
          <p
            className={cn(
              "text-xs truncate",
              isDesktopSelected ? "text-white/95" : "text-white/84"
            )}
          >
            {descriptionLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="truncate text-4xl font-light leading-none">{temperatureLabel}</p>
          <p
            className={cn(
              "truncate text-[10px]",
              isDesktopSelected ? "text-white/90" : "text-white/78"
            )}
          >
            {highLowLabel}
          </p>
        </div>
      </div>
    </button>
  );
}

function WeatherScenePreviewControls({
  value,
  onChange,
}: {
  value: WeatherScenePreviewMode;
  onChange: (value: WeatherScenePreviewMode) => void;
}) {
  return (
    <section className="rounded-2xl bg-white/[0.1] p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72">
            Scene Preview
          </p>
          <p className="mt-1 text-xs text-white/72">
            Force a weather mood to preview backgrounds and motion.
          </p>
        </div>
        <p className="shrink-0 text-xs font-medium capitalize text-white/84">
          {value}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {WEATHER_SCENE_PREVIEW_OPTIONS.map((option) => {
          const isActive = option === value;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                isActive
                  ? "border-white/55 bg-white/22 text-white"
                  : "border-white/12 bg-white/[0.06] text-white/72 hover:bg-white/[0.1]"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function WeatherApp({ isMobile = false, inShell = false }: WeatherAppProps) {
  const isMobileView = isMobile;
  const windowFocus = useWindowFocus();
  const inDesktopShell = !!(inShell && windowFocus && !isMobileView);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [customCities, setCustomCities] = useState<CityConfig[]>(() =>
    loadWeatherCustomCities()
  );
  const [weatherByCity, setWeatherByCity] = useState<Record<string, CityWeather>>(
    () => restoreWeatherDataFromCache(loadWeatherDataCache())
  );
  const [selectedCityId, setSelectedCityId] = useState(
    () => loadWeatherSelectedCity() ?? DEFAULT_CITIES[0]?.id ?? "san-francisco"
  );
  const [failed, setFailed] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<CityConfig[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [scenePreviewMode, setScenePreviewMode] =
    useState<WeatherScenePreviewMode>("auto");
  const hasFetchedAnyDataRef = useRef(false);
  const latestWeatherRequestIdRef = useRef(0);
  const trimmedSearchQuery = searchQuery.trim();

  const allCities = useMemo(() => {
    const merged: CityConfig[] = [];
    const seenCoordinates = new Set<string>();
    for (const city of [...DEFAULT_CITIES, ...customCities]) {
      const key = getCityCoordinateKey(city);
      if (seenCoordinates.has(key)) continue;
      seenCoordinates.add(key);
      merged.push(city);
    }
    return merged;
  }, [customCities]);

  useEffect(() => {
    saveWeatherCustomCities(customCities);
  }, [customCities]);

  useEffect(() => {
    if (!selectedCityId) return;
    saveWeatherSelectedCity(selectedCityId);
  }, [selectedCityId]);

  useEffect(() => {
    saveWeatherDataCache(serializeWeatherDataForCache(weatherByCity));
  }, [weatherByCity]);

  useEffect(() => {
    if (Object.keys(weatherByCity).length > 0) {
      hasFetchedAnyDataRef.current = true;
    }
  }, [weatherByCity]);

  useEffect(() => {
    setSelectedCityId((currentSelectedCityId) => {
      if (allCities.some((city) => city.id === currentSelectedCityId)) {
        return currentSelectedCityId;
      }
      return allCities[0]?.id ?? currentSelectedCityId;
    });
  }, [allCities]);

  const loadWeather = useCallback(async () => {
    if (allCities.length === 0) return;
    const requestId = ++latestWeatherRequestIdRef.current;

    try {
      const responses: PromiseSettledResult<CityWeather>[] = [];
      for (let index = 0; index < allCities.length; index += WEATHER_FETCH_BATCH_SIZE) {
        const cityBatch = allCities.slice(index, index + WEATHER_FETCH_BATCH_SIZE);
        const batchResponses = await Promise.allSettled(
          cityBatch.map((city) => fetchCityWeather(city))
        );
        if (requestId !== latestWeatherRequestIdRef.current) {
          return;
        }
        responses.push(...batchResponses);
      }
      if (requestId !== latestWeatherRequestIdRef.current) {
        return;
      }

      const nextWeatherByCity: Record<string, CityWeather> = {};
      let failedResponseCount = 0;

      for (const result of responses) {
        if (result.status === "fulfilled") {
          nextWeatherByCity[result.value.cityId] = result.value;
        } else {
          failedResponseCount += 1;
        }
      }

      if (Object.keys(nextWeatherByCity).length === 0) {
        throw new Error("No weather responses returned");
      }

      hasFetchedAnyDataRef.current = true;
      setWeatherByCity((previousWeatherByCity) => {
        const cityIds = new Set(allCities.map((city) => city.id));
        const mergedWeatherByCity = {
          ...previousWeatherByCity,
          ...nextWeatherByCity,
        };

        for (const cityId of Object.keys(mergedWeatherByCity)) {
          if (!cityIds.has(cityId)) {
            delete mergedWeatherByCity[cityId];
          }
        }

        return mergedWeatherByCity;
      });
      setFailed(false);
      setRefreshNotice(
        failedResponseCount > 0
          ? "Some locations could not refresh right now. Showing the latest available weather."
          : null
      );
    } catch {
      if (requestId !== latestWeatherRequestIdRef.current) {
        return;
      }
      if (!hasFetchedAnyDataRef.current) {
        setFailed(true);
      } else {
        setRefreshNotice("Weather service is busy right now. Showing cached weather.");
      }
    }
  }, [allCities]);

  useEffect(() => {
    if (!trimmedSearchQuery) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await geocodeCities(trimmedSearchQuery);
          if (!cancelled) {
            setSearchResults(results);
          }
        } catch {
          if (!cancelled) {
            setSearchResults([]);
          }
        } finally {
          if (!cancelled) {
            setSearchLoading(false);
          }
        }
      })();
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [trimmedSearchQuery]);

  useEffect(() => {
    void loadWeather();
    const interval = window.setInterval(() => {
      void loadWeather();
    }, 10 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [loadWeather]);

  useEffect(() => {
    if (!containerRef.current) return;
    const root = containerRef.current;
    setContainerWidth(root.clientWidth);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const firstAvailableWeather = useMemo(
    () =>
      allCities.map((city) => weatherByCity[city.id]).find(
        (weather): weather is CityWeather => !!weather
      ) ?? null,
    [allCities, weatherByCity]
  );

  const selectedCity = useMemo(
    () => allCities.find((city) => city.id === selectedCityId) ?? null,
    [allCities, selectedCityId]
  );
  const selectedWeather = weatherByCity[selectedCityId] ?? null;
  const cityCards = useMemo(
    () =>
      allCities.map((city) => ({
        id: city.id,
        name: city.name,
        weather: weatherByCity[city.id] ?? null,
        scene: weatherByCity[city.id]
          ? getWeatherScene(
              weatherByCity[city.id].currentTime,
              getSceneCodeOverride(scenePreviewMode) ??
                weatherByCity[city.id].weatherCode
            )
          : null,
      })),
    [allCities, weatherByCity, scenePreviewMode]
  );
  const searchResultItems = useMemo(
    () =>
      searchResults.map((result) => ({
        city: result,
        existingCityId: findMatchingCity(allCities, result)?.id ?? null,
      })),
    [allCities, searchResults]
  );

  const handleSelectSearchResult = useCallback(
    (result: CityConfig, existingCityId: string | null) => {
      const targetCityId = existingCityId ?? result.id;

      if (!existingCityId) {
        setCustomCities((previousCities) => {
          const existing = findMatchingCity([...DEFAULT_CITIES, ...previousCities], result);
          if (existing) return previousCities;
          return [...previousCities, result];
        });
      }

      setSelectedCityId(targetCityId);
      setSearchQuery("");
      setSearchActive(false);
      searchInputRef.current?.blur();
    },
    []
  );

  const dailyRange = useMemo(() => {
    const daily = selectedWeather?.daily ?? [];
    const min = Math.min(...daily.map((d) => d.low), 0);
    const max = Math.max(...daily.map((d) => d.high), 0);
    return { min, span: Math.max(1, max - min) };
  }, [selectedWeather]);

  const mainContentWidth = Math.max(0, containerWidth - (isMobileView ? 0 : 320));
  const compactMainContent = mainContentWidth < 700;
  const denseMainContent = mainContentWidth < 560;
  const hourlyGridColsClass =
    mainContentWidth < 420
      ? "grid-cols-3"
      : mainContentWidth < 560
        ? "grid-cols-4"
        : mainContentWidth < 720
          ? "grid-cols-5"
          : mainContentWidth < 900
            ? "grid-cols-6"
            : "grid-cols-10";
  const activeScene = useMemo(
    () =>
      getWeatherScene(
        (selectedWeather ?? firstAvailableWeather)?.currentTime ?? "",
        getSceneCodeOverride(scenePreviewMode) ??
          (selectedWeather ?? firstAvailableWeather)?.weatherCode ??
          1
      ),
    [selectedWeather, firstAvailableWeather, scenePreviewMode]
  );

  const sidebarShellClass = "backdrop-blur-md";
  const mainCardClass = "bg-white/[0.12] backdrop-blur-sm";
  const innerCardClass = "bg-white/[0.08]";
  const bodyTextClass = "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]";
  const mutedTextClass = "text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]";
  const sidebarBackgroundImage = `linear-gradient(180deg, rgba(8,16,34,0.2) 0%, rgba(8,16,34,0.34) 100%), ${activeScene.background}`;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (windowFocus && !windowFocus.isFocused) return;
      if (isMobileView) return;
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const isSearchFocused = document.activeElement === searchInputRef.current;

      if (event.key === "Escape" && (isSearchFocused || searchActive || !!searchQuery)) {
        event.preventDefault();
        if (searchQuery) {
          setSearchQuery("");
        }
        setSearchActive(false);
        (document.activeElement as HTMLElement | null)?.blur();
        return;
      }

      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget
      ) {
        event.preventDefault();
        setSearchActive(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [windowFocus, isMobileView, searchActive, searchQuery]);

  return (
    <div ref={containerRef} className="h-full flex bg-background" data-app="weather">
      <div className="flex-1 min-h-0 relative overflow-hidden" style={{ background: activeScene.background }}>
        <div className="pointer-events-none absolute inset-0">
          {activeScene.showSunGlow && (
            <>
              <div className="absolute -top-14 right-[16%] h-52 w-52 rounded-full bg-yellow-100/18 blur-3xl" />
              <div className="absolute top-4 right-[22%] h-24 w-24 rounded-full bg-yellow-200/30 blur-2xl" />
            </>
          )}
          {activeScene.showStars && (
            <div
              className="absolute inset-0 opacity-75"
              style={{
                backgroundImage:
                  "radial-gradient(2px 2px at 12px 18px, rgba(255,255,255,0.95), transparent 60%), radial-gradient(1.5px 1.5px at 52px 36px, rgba(255,255,255,0.85), transparent 60%), radial-gradient(2px 2px at 98px 62px, rgba(255,255,255,0.9), transparent 60%), radial-gradient(1.5px 1.5px at 154px 28px, rgba(255,255,255,0.8), transparent 60%)",
                backgroundSize: "180px 120px",
              }}
            />
          )}
          {activeScene.showCloudBands && (
            <>
              <div
                className={cn(
                  "absolute left-[14%] top-[12%] h-24 w-80 rounded-full blur-3xl",
                  activeScene.showLightning
                    ? "bg-slate-200/[0.14]"
                    : activeScene.mood === "cloudy"
                      ? "bg-white/[0.2]"
                      : activeScene.mood === "fog"
                        ? "bg-slate-100/[0.18]"
                        : "bg-white/16"
                )}
              />
              <div
                className={cn(
                  "absolute right-[6%] top-[26%] h-20 w-72 rounded-full blur-3xl",
                  activeScene.showLightning
                    ? "bg-slate-100/10"
                    : activeScene.mood === "cloudy"
                      ? "bg-white/[0.18]"
                      : activeScene.mood === "fog"
                        ? "bg-slate-100/[0.16]"
                        : "bg-white/14"
                )}
              />
              <div
                className={cn(
                  "absolute left-[32%] bottom-[24%] h-24 w-96 rounded-full blur-3xl",
                  activeScene.showLightning
                    ? "bg-slate-100/[0.08]"
                    : activeScene.mood === "cloudy"
                      ? "bg-white/[0.14]"
                      : activeScene.mood === "fog"
                        ? "bg-slate-100/[0.2]"
                        : "bg-white/12"
                )}
              />
              {activeScene.showLightning && (
                <>
                  <div className="absolute left-[10%] top-[16%] h-24 w-[34%] rounded-full bg-slate-950/14 blur-3xl" />
                  <div className="absolute right-[12%] top-[14%] h-28 w-[38%] rounded-full bg-slate-950/16 blur-3xl" />
                </>
              )}
            </>
          )}
          {activeScene.showFog && (
            <>
              <div className="absolute inset-x-[8%] top-[22%] h-28 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute inset-x-[4%] top-[46%] h-24 rounded-full bg-white/12 blur-3xl" />
              <div className="absolute inset-x-0 bottom-[8%] h-32 bg-white/18 blur-2xl" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-white/24 blur-3xl" />
            </>
          )}
          {activeScene.showRain && (
            <div className="absolute inset-0 overflow-hidden">
              {WEATHER_RAIN_DROPS.map((drop, index) => (
                <div
                  key={`${drop.left}-${index}`}
                  className="weather-rain-drop absolute rounded-full"
                  style={{
                    left: drop.left,
                    top: drop.top,
                    width: activeScene.showLightning ? "2px" : "1.5px",
                    height: `${drop.height}px`,
                    opacity: drop.opacity,
                    background:
                      activeScene.showLightning
                        ? "linear-gradient(180deg, rgba(236,244,255,0) 0%, rgba(236,244,255,0.92) 38%, rgba(173,205,255,0.92) 100%)"
                        : "linear-gradient(180deg, rgba(236,244,255,0) 0%, rgba(236,244,255,0.8) 42%, rgba(185,214,255,0.82) 100%)",
                    boxShadow: activeScene.showLightning
                      ? "0 0 6px rgba(196,220,255,0.18)"
                      : "none",
                    ["--rain-duration" as string]: `${drop.duration}s`,
                    ["--rain-delay" as string]: `${drop.delay}s`,
                    ["--rain-drift" as string]: `${drop.drift}px`,
                  }}
                />
              ))}
            </div>
          )}
          {activeScene.showSnow && (
            <div className="absolute inset-0 overflow-hidden">
              {WEATHER_SNOW_FLAKES.map((flake, index) => (
                <div
                  key={`${flake.left}-${index}`}
                  className="weather-snow-flake absolute rounded-full"
                  style={{
                    left: flake.left,
                    top: flake.top,
                    width: `${flake.size}px`,
                    height: `${flake.size}px`,
                    opacity: flake.opacity,
                    background:
                      "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(231,239,255,0.82) 60%, rgba(231,239,255,0.08) 100%)",
                    boxShadow: "0 0 8px rgba(233,241,255,0.22)",
                    ["--snow-duration" as string]: `${flake.duration}s`,
                    ["--snow-delay" as string]: `${flake.delay}s`,
                    ["--snow-drift" as string]: `${flake.drift}px`,
                  }}
                />
              ))}
            </div>
          )}
          {activeScene.showLightning && (
            <>
              <div className="weather-storm-flash absolute inset-0 bg-[radial-gradient(56%_38%_at_76%_14%,rgba(239,245,255,0.55),rgba(214,229,255,0.18)_20%,transparent_58%)] mix-blend-screen" />
              {WEATHER_LIGHTNING_BOLTS.map((bolt, index) => (
                <div
                  key={`${bolt.left}-${index}`}
                  className="weather-lightning-bolt absolute"
                  style={{
                    left: bolt.left,
                    top: bolt.top,
                    width: bolt.width,
                    height: bolt.height,
                    animationDelay: bolt.delay,
                    clipPath: bolt.clipPath,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(221,235,255,0.94) 44%, rgba(157,201,255,0.82) 76%, rgba(157,201,255,0) 100%)",
                    filter:
                      "drop-shadow(0 0 8px rgba(223,236,255,0.8)) drop-shadow(0 0 20px rgba(119,178,255,0.34))",
                  }}
                />
              ))}
              <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,transparent_0%,rgba(8,15,28,0.08)_42%,rgba(8,15,28,0.26)_100%)]" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
        </div>

        {failed && !hasFetchedAnyDataRef.current && (
          <div className="relative z-[1] h-full flex items-center justify-center px-4 text-sm text-white/90">
            Unable to load weather right now.
          </div>
        )}

        {(!failed || hasFetchedAnyDataRef.current) && (
          <div className={cn("relative z-[1] h-full flex", bodyTextClass)}>
          {!isMobileView && (
            <aside
              className={cn(
                "relative overflow-hidden w-[320px] min-w-[320px] max-w-[320px] shrink-0 flex flex-col",
                sidebarShellClass
              )}
              style={{ backgroundImage: sidebarBackgroundImage }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(8,16,34,0.32) 0%, rgba(8,16,34,0.2) 56%, rgba(8,16,34,0) 100%)",
                }}
              />
              <div className="sticky top-0 z-[2]">
                <WindowNavShell
                  isMobile={false}
                  className="bg-transparent px-4 py-2"
                  onMouseDown={inDesktopShell ? windowFocus?.onDragStart : undefined}
                  left={
                    <WindowControls
                      inShell={inDesktopShell}
                      showWhenNotInShell={!isMobileView}
                      className="p-2"
                      onClose={
                        inDesktopShell
                          ? windowFocus?.closeWindow
                          : !isMobileView
                            ? () => window.close()
                            : undefined
                      }
                      onMinimize={inDesktopShell ? windowFocus?.minimizeWindow : undefined}
                      onToggleMaximize={inDesktopShell ? windowFocus?.toggleMaximize : undefined}
                      isMaximized={windowFocus?.isMaximized ?? false}
                      closeLabel={inDesktopShell ? "Close window" : "Close tab"}
                    />
                  }
                  right={<WindowNavSpacer isMobile={false} />}
                />
                <div
                  className="px-3 pb-2 select-none"
                  onMouseDown={inDesktopShell ? windowFocus?.onDragStart : undefined}
                >
                  <div className="relative">
                    <Search
                      className={cn(
                        "pointer-events-none absolute left-2 top-1/2 -translate-y-1/2",
                        "text-white/70"
                      )}
                      size={14}
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onFocus={() => setSearchActive(true)}
                      onBlur={() => setSearchActive(false)}
                      onMouseDown={(event) => event.stopPropagation()}
                      aria-label="Search cities"
                      placeholder="Search"
                      className={cn(
                        "w-full pl-8 pr-8 py-0.5 rounded-lg focus:outline-none text-sm",
                        "bg-white/[0.12] text-white placeholder:text-white/65"
                      )}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onClick={() => {
                          setSearchQuery("");
                          searchInputRef.current?.focus();
                        }}
                        className={cn(
                          "absolute right-2 top-1/2 -translate-y-1/2",
                          "text-white/70 hover:text-white"
                        )}
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <ScrollArea className="flex-1" bottomMargin="0" viewportClassName="px-1">
                {trimmedSearchQuery ? (
                  <div className="px-2 pt-1 pb-3">
                    {searchLoading && (
                      <p className="px-1 py-2 text-sm text-white/76">Searching...</p>
                    )}
                    {!searchLoading && searchResultItems.length === 0 && (
                      <p className="px-1 py-2 text-sm text-white/76">No matching locations</p>
                    )}
                    <div className="space-y-1">
                      {searchResultItems.map(({ city, existingCityId }) => {
                        const [primaryName, ...secondaryParts] = city.name.split(", ");
                        const secondaryName = secondaryParts.join(", ");

                        return (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => handleSelectSearchResult(city, existingCityId)}
                            className="w-full rounded-md px-1.5 py-1.5 text-left text-white/90 transition-colors"
                          >
                            <p className="truncate text-sm [text-shadow:0_1px_2px_rgba(5,14,31,0.45)]">
                              <span className="font-medium text-white/95">{primaryName}</span>
                              {secondaryName && (
                                <span className="font-medium text-white/76">{` ${secondaryName}`}</span>
                              )}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="px-2 pt-1 pb-2 space-y-2">
                    {WEATHER_SCENE_PREVIEW_ENABLED && (
                      <WeatherScenePreviewControls
                        value={scenePreviewMode}
                        onChange={setScenePreviewMode}
                      />
                    )}
                    {cityCards.map((city) => (
                      <SidebarCityItem
                        key={city.id}
                        cityName={city.name}
                        weather={city.weather}
                        scene={city.scene}
                        isSelected={city.id === selectedCityId}
                        isMobileView={isMobileView}
                        onSelect={() => setSelectedCityId(city.id)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </aside>
          )}

          <main className="flex-1 min-w-0 min-h-0 bg-transparent relative">
            {!isMobileView && inDesktopShell && (
              <div
                className="absolute top-0 left-0 right-0 h-12 z-10 select-none"
                onMouseDown={windowFocus?.onDragStart}
              />
            )}
            <ScrollArea className="h-full" bottomMargin="0">
              <div className="p-4 space-y-4">
                {isMobileView && (
                  <div className="flex gap-4 overflow-x-auto pb-1">
                    {cityCards.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => setSelectedCityId(city.id)}
                        className={cn(
                          "shrink-0 pb-1 text-sm",
                          city.id === selectedCityId
                            ? "text-[#0A7CFF] font-medium"
                            : "text-white/82"
                        )}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                )}

                {isMobileView && WEATHER_SCENE_PREVIEW_ENABLED && (
                  <WeatherScenePreviewControls
                    value={scenePreviewMode}
                    onChange={setScenePreviewMode}
                  />
                )}

                <section className={cn("rounded-2xl overflow-hidden text-white", mainCardClass)}>
                  <div className="px-5 py-6" style={{ background: activeScene.heroGradient }}>
                    <div className="text-center">
                      {selectedWeather ? (
                        <>
                          <p className={cn("font-medium tracking-tight", compactMainContent ? "text-lg" : "text-xl")}>
                            {selectedWeather.cityName}
                          </p>
                          <p
                            className={cn(
                              "leading-none font-light mt-1",
                              denseMainContent
                                ? "text-[56px]"
                                : compactMainContent
                                  ? "text-[68px]"
                                  : "text-[84px]"
                            )}
                          >
                            {Math.round(selectedWeather.currentTemp)}°
                          </p>
                          <p className={cn("font-medium -mt-1", compactMainContent ? "text-xl" : "text-2xl")}>
                            {getWeatherDescription(selectedWeather.weatherCode)}
                          </p>
                          <p className={cn("font-semibold", compactMainContent ? "text-lg" : "text-xl")}>
                            H:{Math.round(selectedWeather.high)}° L:{Math.round(selectedWeather.low)}°
                          </p>
                        </>
                      ) : (
                        <>
                          <p className={cn("font-medium tracking-tight", compactMainContent ? "text-lg" : "text-xl")}>
                            {selectedCity?.name ?? "Weather"}
                          </p>
                          <div className="h-20 w-36 mt-3 mx-auto rounded bg-white/20 animate-pulse" />
                          <div className="h-6 w-28 mt-2 mx-auto rounded bg-white/20 animate-pulse" />
                          <div className="h-5 w-32 mt-2 mx-auto rounded bg-white/20 animate-pulse" />
                        </>
                      )}
                    </div>
                  </div>
                </section>

                <section className={cn("rounded-2xl p-3", mainCardClass)}>
                  {selectedWeather ? (
                    <p className={cn("text-sm font-medium", mutedTextClass)}>
                      {`${getWeatherDescription(selectedWeather.weatherCode)} expected around ${formatHourLabel(
                        selectedWeather.hourly[3]?.time ?? selectedWeather.hourly[0]?.time ?? ""
                      )}. Wind gusts up to ${Math.round(selectedWeather.windMph)} mph.`}
                    </p>
                  ) : (
                    <div className="h-5 w-[75%] rounded bg-white/20 animate-pulse" />
                  )}
                    <div
                      className={cn(
                        "mt-3 pt-3 grid gap-2",
                        hourlyGridColsClass
                      )}
                    >
                    {(selectedWeather?.hourly ?? Array.from({ length: 10 })).map((hour, index) => (
                      <div
                        key={selectedWeather ? `${hour.time}-${index}` : `loading-hour-${index}`}
                        className={cn("min-w-0 rounded-lg px-2 py-2 text-center", innerCardClass)}
                      >
                        <p className="text-xs font-semibold">
                          {selectedWeather
                            ? index === 0
                              ? "Now"
                              : formatHourLabel((hour as HourForecast).time)
                            : "--"}
                        </p>
                        {selectedWeather ? (
                          <>
                            <WeatherIcon
                              code={(hour as HourForecast).weatherCode}
                              className={cn("w-4 h-4 mx-auto mt-1", mutedTextClass)}
                            />
                            <p className="text-xl font-medium leading-none mt-1">
                              {Math.round((hour as HourForecast).temperature)}°
                            </p>
                            <p className={cn("text-[10px]", mutedTextClass)}>
                              {Math.round((hour as HourForecast).precipitationChance)}%
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="h-4 w-4 mx-auto mt-1 rounded bg-white/20 animate-pulse" />
                            <div className="h-6 w-9 mt-2 mx-auto rounded bg-white/20 animate-pulse" />
                            <div className="h-3 w-6 mt-1 mx-auto rounded bg-white/20 animate-pulse" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <div
                  className={cn(
                    "grid gap-4",
                    compactMainContent ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"
                  )}
                >
                  <section className={cn("rounded-2xl p-3", mainCardClass)}>
                    <p className={cn("text-xs font-semibold uppercase tracking-wide", mutedTextClass)}>
                      10-Day Forecast
                    </p>
                    <div className="mt-2">
                      {(selectedWeather?.daily ?? Array.from({ length: 10 })).map((day, index) => {
                        if (!selectedWeather) {
                          return (
                            <div key={`loading-day-${index}`} className="py-2.5 grid grid-cols-[72px_20px_34px_1fr_34px] items-center gap-2">
                              <div className="h-4 w-14 rounded bg-white/20 animate-pulse" />
                              <div className="h-4 w-4 rounded bg-white/20 animate-pulse" />
                              <div className="h-4 w-8 rounded bg-white/20 animate-pulse" />
                              <div className="h-1.5 rounded-full bg-white/20 animate-pulse" />
                              <div className="h-4 w-8 justify-self-end rounded bg-white/20 animate-pulse" />
                            </div>
                          );
                        }

                        const barLeft = ((day.low - dailyRange.min) / dailyRange.span) * 100;
                        const barWidth = ((day.high - day.low) / dailyRange.span) * 100;

                        return (
                          <div
                            key={day.date}
                            className={cn(
                              "py-2.5 grid items-center gap-2",
                              denseMainContent
                                ? "grid-cols-[58px_18px_30px_1fr_30px]"
                                : "grid-cols-[72px_20px_34px_1fr_34px]"
                            )}
                          >
                            <p className={cn("font-medium", denseMainContent ? "text-xs" : "text-sm")}>
                              {formatWeekday(day.date, index)}
                            </p>
                            <WeatherIcon
                              code={day.weatherCode}
                              className={cn("w-4 h-4", mutedTextClass)}
                            />
                            <p className={cn(mutedTextClass, denseMainContent ? "text-xs" : "text-sm")}>
                              {Math.round(day.low)}°
                            </p>
                            <div className={cn("h-1.5 rounded-full relative overflow-hidden", innerCardClass)}>
                              <div
                                className="absolute top-0 h-full rounded-full bg-gradient-to-r from-[#72b9ff] to-[#ffd46b]"
                                style={{
                                  left: `${barLeft}%`,
                                  width: `${Math.max(barWidth, 8)}%`,
                                }}
                              />
                            </div>
                            <p className={cn("text-right font-semibold", denseMainContent ? "text-xs" : "text-sm")}>
                              {Math.round(day.high)}°
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className={cn("rounded-2xl p-3", mainCardClass)}>
                    <p className={cn("text-xs font-semibold uppercase tracking-wide", mutedTextClass)}>
                      Conditions
                    </p>
                    <div className={cn("mt-2 grid gap-2", denseMainContent ? "grid-cols-1" : "grid-cols-2")}>
                      <div className={cn("rounded-xl p-3", innerCardClass)}>
                        <div className={cn("flex items-center gap-1.5", mutedTextClass)}>
                          <Droplets size={14} />
                          <span className="text-xs">Humidity</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold">
                          {selectedWeather ? `${Math.round(selectedWeather.humidity)}%` : "--"}
                        </p>
                      </div>
                      <div className={cn("rounded-xl p-3", innerCardClass)}>
                        <div className={cn("flex items-center gap-1.5", mutedTextClass)}>
                          <Wind size={14} />
                          <span className="text-xs">Wind</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold">
                          {selectedWeather ? `${Math.round(selectedWeather.windMph)} mph` : "--"}
                        </p>
                      </div>
                      <div className={cn("rounded-xl p-3", innerCardClass)}>
                        <div className={cn("flex items-center gap-1.5", mutedTextClass)}>
                          <Sun size={14} />
                          <span className="text-xs">Feels Like</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold">
                          {selectedWeather ? `${Math.round(selectedWeather.feelsLike)}°` : "--"}
                        </p>
                      </div>
                      <div className={cn("rounded-xl p-3", innerCardClass)}>
                        <div className={cn("flex items-center gap-1.5", mutedTextClass)}>
                          <CloudRain size={14} />
                          <span className="text-xs">Max Rain</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold">
                          {selectedWeather
                            ? `${Math.round(selectedWeather.daily[0]?.precipitationChance ?? 0)}%`
                            : "--"}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                {selectedWeather && (
                  <div className="pt-1 pb-2 text-center">
                    <p className={cn("text-[11px]", "text-white/65")}>
                      Updated {formatUpdatedTime(selectedWeather.updatedAt)}
                    </p>
                    {refreshNotice && (
                      <p className={cn("mt-1 text-[11px]", "text-white/72")}>
                        {refreshNotice}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </main>
          </div>
        )}
      </div>
    </div>
  );
}
