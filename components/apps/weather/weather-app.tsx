"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Sun,
  Umbrella,
  Wind,
} from "lucide-react";
import { WindowControls } from "@/components/window-controls";
import { useWindowFocus } from "@/lib/window-focus-context";
import { cn } from "@/lib/utils";

interface WeatherAppProps {
  isMobile?: boolean;
  inShell?: boolean;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
}

interface HourForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationChance: number;
}

interface WeatherSnapshot {
  city: string;
  currentTemp: number;
  weatherCode: number;
  high: number;
  low: number;
  feelsLike: number;
  humidity: number;
  windMph: number;
  precipitationMax: number;
  sunrise: string;
  sunset: string;
  hourly: HourForecast[];
  updatedAt: Date;
}

const WEATHER_API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=37.78&longitude=-122.42&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&hourly=temperature_2m,weather_code,precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=2";

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Showers";
  return "Thunderstorm";
}

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0) return <Sun className={className} />;
  if (code <= 3) return <Cloud className={className} />;
  if (code <= 48) return <CloudFog className={className} />;
  if (code <= 57) return <CloudDrizzle className={className} />;
  if (code <= 67) return <CloudRain className={className} />;
  if (code <= 77) return <CloudSnow className={className} />;
  if (code <= 82) return <CloudRain className={className} />;
  return <CloudLightning className={className} />;
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
  });
}

function formatClockTime(iso: string): string {
  if (!iso) return "--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function WeatherLoadingState() {
  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl h-44 bg-black/10 dark:bg-white/10 animate-pulse" />
      <div className="rounded-xl h-36 bg-black/10 dark:bg-white/10 animate-pulse" />
      <div className="rounded-xl h-24 bg-black/10 dark:bg-white/10 animate-pulse" />
    </div>
  );
}

export function WeatherApp({ isMobile = false, inShell = false }: WeatherAppProps) {
  const windowFocus = useWindowFocus();
  const inDesktopShell = !!(inShell && windowFocus && !isMobile);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadWeather = useCallback(async () => {
    try {
      const res = await fetch(WEATHER_API_URL);
      if (!res.ok) {
        throw new Error(`Weather request failed: ${res.status}`);
      }

      const data = (await res.json()) as OpenMeteoResponse;
      const now = Date.now();
      const firstUpcomingIndex = data.hourly.time.findIndex(
        (time) => new Date(time).getTime() >= now
      );
      const startIndex = firstUpcomingIndex === -1 ? 0 : firstUpcomingIndex;

      const hourly = data.hourly.time.slice(startIndex, startIndex + 8).map((time, index) => {
        const sourceIndex = startIndex + index;
        return {
          time,
          temperature: data.hourly.temperature_2m[sourceIndex] ?? 0,
          weatherCode: data.hourly.weather_code[sourceIndex] ?? 0,
          precipitationChance: data.hourly.precipitation_probability[sourceIndex] ?? 0,
        };
      });

      setWeather({
        city: "San Francisco",
        currentTemp: data.current.temperature_2m,
        weatherCode: data.current.weather_code,
        high: data.daily.temperature_2m_max[0] ?? data.current.temperature_2m,
        low: data.daily.temperature_2m_min[0] ?? data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windMph: data.current.wind_speed_10m,
        precipitationMax: data.daily.precipitation_probability_max[0] ?? 0,
        sunrise: data.daily.sunrise[0] ?? "",
        sunset: data.daily.sunset[0] ?? "",
        hourly,
        updatedAt: new Date(),
      });
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    loadWeather().catch(() => {
      if (active) {
        setFailed(true);
        setLoading(false);
      }
    });

    const interval = window.setInterval(() => {
      loadWeather().catch(() => {
        if (active) setFailed(true);
      });
    }, 10 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [loadWeather]);

  const updatedLabel = useMemo(() => {
    if (!weather) return "";
    return weather.updatedAt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }, [weather]);

  return (
    <div className="h-full flex flex-col bg-background" data-app="weather">
      <div
        className={cn(
          "sticky top-0 z-[1] flex min-w-0 items-center justify-between px-4 py-2 bg-muted border-b border-border/50 select-none"
        )}
        onMouseDown={inDesktopShell ? windowFocus?.onDragStart : undefined}
      >
        <div
          className="shrink-0"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <WindowControls
            inShell={inDesktopShell}
            showWhenNotInShell={!isMobile}
            className="p-2"
            onClose={
              inDesktopShell
                ? windowFocus?.closeWindow
                : !isMobile
                  ? () => window.close()
                  : undefined
            }
            onMinimize={inDesktopShell ? windowFocus?.minimizeWindow : undefined}
            onToggleMaximize={inDesktopShell ? windowFocus?.toggleMaximize : undefined}
            isMaximized={windowFocus?.isMaximized ?? false}
            closeLabel={inDesktopShell ? "Close window" : "Close tab"}
          />
        </div>
        <div className="flex-1 min-w-0 px-2 text-center">
          <span className="block truncate text-sm font-semibold">Weather</span>
        </div>
        <div className="shrink-0 text-xs text-muted-foreground tabular-nums min-w-[72px] text-right">
          {weather ? `Updated ${updatedLabel}` : ""}
        </div>
      </div>

      {loading && <WeatherLoadingState />}

      {!loading && failed && (
        <div className="flex-1 flex items-center justify-center px-4 text-sm text-muted-foreground">
          Unable to load weather right now.
        </div>
      )}

      {!loading && !failed && weather && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <section className="rounded-2xl bg-gradient-to-br from-[#0A7CFF] to-[#58B5FF] text-white p-5">
            <p className="text-sm/none opacity-90">{weather.city}</p>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-5xl font-light leading-none">
                  {Math.round(weather.currentTemp)}°
                </p>
                <p className="mt-1 text-sm font-medium opacity-95">
                  {getWeatherDescription(weather.weatherCode)}
                </p>
                <p className="text-xs opacity-90">
                  H:{Math.round(weather.high)}° L:{Math.round(weather.low)}°
                </p>
              </div>
              <WeatherIcon code={weather.weatherCode} className="w-16 h-16 opacity-95" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5" />
                <span>Humidity {Math.round(weather.humidity)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5" />
                <span>Wind {Math.round(weather.windMph)} mph</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5" />
                <span>Rain {Math.round(weather.precipitationMax)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" />
                <span>Feels {Math.round(weather.feelsLike)}°</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-muted p-3">
            <h2 className="text-sm font-semibold">Next 8 Hours</h2>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {weather.hourly.map((hour) => (
                <div
                  key={hour.time}
                  className="shrink-0 w-16 rounded-lg bg-background border border-border/60 px-2 py-2 text-center"
                >
                  <p className="text-[10px] text-muted-foreground">{formatHour(hour.time)}</p>
                  <WeatherIcon
                    code={hour.weatherCode}
                    className="w-4 h-4 mx-auto my-1 text-muted-foreground"
                  />
                  <p className="text-xs font-medium">{Math.round(hour.temperature)}°</p>
                  <p className="text-[10px] text-muted-foreground">
                    {Math.round(hour.precipitationChance)}%
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-muted p-3">
            <h2 className="text-sm font-semibold">Sun & Rain</h2>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <div className="rounded-lg bg-background border border-border/60 px-3 py-2 flex items-center gap-2">
                <Sun className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Sunrise</p>
                  <p className="font-medium">{formatClockTime(weather.sunrise)}</p>
                </div>
              </div>
              <div className="rounded-lg bg-background border border-border/60 px-3 py-2 flex items-center gap-2">
                <Umbrella className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Sunset</p>
                  <p className="font-medium">{formatClockTime(weather.sunset)}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
