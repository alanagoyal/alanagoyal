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
} from "lucide-react";
import { WindowControls } from "@/components/window-controls";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface CityConfig {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

const CITIES: CityConfig[] = [
  { id: "san-francisco", name: "San Francisco", latitude: 37.78, longitude: -122.42 },
  { id: "seattle", name: "Seattle", latitude: 47.61, longitude: -122.33 },
  { id: "los-gatos", name: "Los Gatos", latitude: 37.24, longitude: -121.96 },
  { id: "la-quinta", name: "La Quinta", latitude: 33.66, longitude: -116.31 },
  { id: "new-york", name: "New York", latitude: 40.71, longitude: -74.01 },
];

function buildWeatherUrl(city: CityConfig): string {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      "temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
    forecast_days: "10",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
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

async function fetchCityWeather(city: CityConfig): Promise<CityWeather> {
  const res = await fetch(buildWeatherUrl(city));
  if (!res.ok) {
    throw new Error(`Weather request failed for ${city.name}: ${res.status}`);
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
  isSelected,
  isMobileView,
  onSelect,
}: {
  cityName: string;
  weather: CityWeather | null;
  isSelected: boolean;
  isMobileView: boolean;
  onSelect: () => void;
}) {
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
        "relative w-full rounded-lg px-2 py-1.5 h-[70px] text-left transition-colors",
        isSelected && !isMobileView && "bg-[#0A7CFF] text-white",
        !isSelected && "text-foreground"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-medium truncate">{cityName}</p>
          <p className={cn("text-xs", isSelected && !isMobileView ? "text-white/85" : "text-muted-foreground")}>
            {timeLabel}
          </p>
          <p className={cn("text-xs truncate", isSelected && !isMobileView ? "text-white/90" : "text-muted-foreground")}>
            {descriptionLabel}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-4xl font-light leading-none">{temperatureLabel}</p>
          <p className={cn("text-[10px]", isSelected && !isMobileView ? "text-white/85" : "text-muted-foreground")}>
            {highLowLabel}
          </p>
        </div>
      </div>
      {!isSelected && (
        <div className="absolute bottom-0 left-14 right-0 border-t border-muted-foreground/20" />
      )}
    </button>
  );
}

export function WeatherApp({ isMobile = false, inShell = false }: WeatherAppProps) {
  const isMobileView = isMobile;
  const windowFocus = useWindowFocus();
  const inDesktopShell = !!(inShell && windowFocus && !isMobileView);
  const containerRef = useRef<HTMLDivElement>(null);

  const [weatherByCity, setWeatherByCity] = useState<Record<string, CityWeather>>({});
  const [selectedCityId, setSelectedCityId] = useState("san-francisco");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const hasFetchedAnyDataRef = useRef(false);

  const loadWeather = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const responses = await Promise.allSettled(CITIES.map((city) => fetchCityWeather(city)));
      const nextWeatherByCity: Record<string, CityWeather> = {};

      for (const result of responses) {
        if (result.status === "fulfilled") {
          nextWeatherByCity[result.value.cityId] = result.value;
        }
      }

      if (Object.keys(nextWeatherByCity).length === 0) {
        throw new Error("No weather responses returned");
      }

      hasFetchedAnyDataRef.current = true;
      setWeatherByCity(nextWeatherByCity);
      setSelectedCityId((currentSelectedCityId) => {
        if (nextWeatherByCity[currentSelectedCityId]) return currentSelectedCityId;
        return CITIES.find((city) => nextWeatherByCity[city.id])?.id ?? currentSelectedCityId;
      });
      setFailed(false);
    } catch {
      if (!hasFetchedAnyDataRef.current) {
        setFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWeather(false);
    const interval = window.setInterval(() => {
      void loadWeather(true);
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
      CITIES.map((city) => weatherByCity[city.id]).find(
        (weather): weather is CityWeather => !!weather
      ) ?? null,
    [weatherByCity]
  );

  const selectedWeather = weatherByCity[selectedCityId] ?? firstAvailableWeather;
  const cityCards = useMemo(
    () =>
      CITIES.map((city) => ({
        id: city.id,
        name: city.name,
        weather: weatherByCity[city.id] ?? null,
      })),
    [weatherByCity]
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

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-background" data-app="weather">
      <div
        className={cn(
          "sticky top-0 z-[1] flex min-w-0 items-center justify-between px-4 py-2 bg-muted border-b border-muted-foreground/20 select-none"
        )}
        onMouseDown={inDesktopShell ? windowFocus?.onDragStart : undefined}
      >
        <div className="shrink-0" onMouseDown={(event) => event.stopPropagation()}>
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
        </div>
        <div className="flex-1 min-w-0 px-2 text-center">
          <span className="block truncate text-sm font-semibold">Weather</span>
        </div>
        <div className="shrink-0 min-w-[88px] text-right text-xs text-muted-foreground tabular-nums">
          {selectedWeather ? `Updated ${formatUpdatedTime(selectedWeather.updatedAt)}` : ""}
        </div>
      </div>

      {failed && !hasFetchedAnyDataRef.current && (
        <div className="flex-1 flex items-center justify-center px-4 text-sm text-muted-foreground">
          Unable to load weather right now.
        </div>
      )}

      {(!failed || hasFetchedAnyDataRef.current) && (
        <div className="flex-1 min-h-0 flex">
          {!isMobileView && (
            <aside className="w-[320px] shrink-0 bg-muted border-r border-muted-foreground/20 flex flex-col">
              <div className="px-3 py-2">
                <div className="relative">
                  <Search
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={14}
                  />
                  <input
                    type="text"
                    value=""
                    readOnly
                    aria-label="Search cities"
                    placeholder="Search"
                    className="w-full pl-8 pr-8 py-0.5 rounded-lg bg-[#E8E8E7] dark:bg-[#353533] placeholder:text-muted-foreground focus:outline-none text-sm"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1" bottomMargin="0">
                <div className="px-2 pb-2">
                  {cityCards.map((city) => (
                    <SidebarCityItem
                      key={city.id}
                      cityName={city.name}
                      weather={city.weather}
                      isSelected={city.id === selectedCityId}
                      isMobileView={isMobileView}
                      onSelect={() => setSelectedCityId(city.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </aside>
          )}

          <main className="flex-1 min-w-0 min-h-0 bg-background">
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
                            ? "text-[#0A7CFF] border-b-2 border-[#0A7CFF] font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                )}

                <section className="rounded-2xl border border-muted-foreground/20 overflow-hidden text-white">
                  <div className="bg-gradient-to-br from-[#467eb9] via-[#5a92cb] to-[#7cb1df] px-5 py-6">
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
                          <div className="h-6 w-40 mx-auto rounded bg-white/20 animate-pulse" />
                          <div className="h-20 w-36 mt-3 mx-auto rounded bg-white/20 animate-pulse" />
                          <div className="h-6 w-28 mt-2 mx-auto rounded bg-white/20 animate-pulse" />
                          <div className="h-5 w-32 mt-2 mx-auto rounded bg-white/20 animate-pulse" />
                        </>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl bg-muted border border-muted-foreground/20 p-3">
                  {selectedWeather ? (
                    <p className="text-sm text-muted-foreground font-medium">
                      {`${getWeatherDescription(selectedWeather.weatherCode)} expected around ${formatHourLabel(
                        selectedWeather.hourly[3]?.time ?? selectedWeather.hourly[0]?.time ?? ""
                      )}. Wind gusts up to ${Math.round(selectedWeather.windMph)} mph.`}
                    </p>
                  ) : (
                    <div className="h-5 w-[75%] rounded bg-black/10 dark:bg-white/15 animate-pulse" />
                  )}
                  <div
                    className={cn(
                      "mt-3 border-t border-muted-foreground/20 pt-3 grid gap-2",
                      hourlyGridColsClass
                    )}
                  >
                    {(selectedWeather?.hourly ?? Array.from({ length: 10 })).map((hour, index) => (
                      <div
                        key={selectedWeather ? `${hour.time}-${index}` : `loading-hour-${index}`}
                        className="min-w-0 rounded-lg bg-background border border-muted-foreground/20 px-2 py-2 text-center"
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
                              className="w-4 h-4 mx-auto mt-1 text-muted-foreground"
                            />
                            <p className="text-xl font-medium leading-none mt-1">
                              {Math.round((hour as HourForecast).temperature)}°
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {Math.round((hour as HourForecast).precipitationChance)}%
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="h-4 w-4 mx-auto mt-1 rounded bg-black/10 dark:bg-white/15 animate-pulse" />
                            <div className="h-6 w-9 mt-2 mx-auto rounded bg-black/10 dark:bg-white/15 animate-pulse" />
                            <div className="h-3 w-6 mt-1 mx-auto rounded bg-black/10 dark:bg-white/15 animate-pulse" />
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
                  <section className="rounded-2xl bg-muted border border-muted-foreground/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      10-Day Forecast
                    </p>
                    <div className="mt-2 divide-y divide-muted-foreground/20">
                      {(selectedWeather?.daily ?? Array.from({ length: 10 })).map((day, index) => {
                        if (!selectedWeather) {
                          return (
                            <div key={`loading-day-${index}`} className="py-2.5 grid grid-cols-[72px_20px_34px_1fr_34px] items-center gap-2">
                              <div className="h-4 w-14 rounded bg-black/10 dark:bg-white/15 animate-pulse" />
                              <div className="h-4 w-4 rounded bg-black/10 dark:bg-white/15 animate-pulse" />
                              <div className="h-4 w-8 rounded bg-black/10 dark:bg-white/15 animate-pulse" />
                              <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/15 animate-pulse" />
                              <div className="h-4 w-8 justify-self-end rounded bg-black/10 dark:bg-white/15 animate-pulse" />
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
                              className="w-4 h-4 text-muted-foreground"
                            />
                            <p className={cn("text-muted-foreground", denseMainContent ? "text-xs" : "text-sm")}>
                              {Math.round(day.low)}°
                            </p>
                            <div className="h-1.5 rounded-full bg-background border border-muted-foreground/20 relative overflow-hidden">
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

                  <section className="rounded-2xl bg-muted border border-muted-foreground/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Conditions
                    </p>
                    <div className={cn("mt-2 grid gap-2", denseMainContent ? "grid-cols-1" : "grid-cols-2")}>
                      <div className="rounded-xl bg-background border border-muted-foreground/20 p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Droplets size={14} />
                          <span className="text-xs">Humidity</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold">
                          {selectedWeather ? `${Math.round(selectedWeather.humidity)}%` : "--"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-background border border-muted-foreground/20 p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Wind size={14} />
                          <span className="text-xs">Wind</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold">
                          {selectedWeather ? `${Math.round(selectedWeather.windMph)} mph` : "--"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-background border border-muted-foreground/20 p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Sun size={14} />
                          <span className="text-xs">Feels Like</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold">
                          {selectedWeather ? `${Math.round(selectedWeather.feelsLike)}°` : "--"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-background border border-muted-foreground/20 p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
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
              </div>
            </ScrollArea>
          </main>
        </div>
      )}
    </div>
  );
}
