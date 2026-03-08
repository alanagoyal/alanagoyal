export type DayPhase = "night" | "dawn" | "day" | "dusk";
export type WeatherMood = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunder";
export type WeatherSceneLayer =
  | "sunGlow"
  | "stars"
  | "cloudBands"
  | "fog"
  | "rain"
  | "snow"
  | "lightning";
export type WeatherCloudTone = "default" | "cloudy" | "fog" | "rain" | "storm";
export type WeatherThemeKey = `${DayPhase}-${WeatherMood}`;
export type WeatherIconName =
  | "sun"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder";

export interface WeatherScene {
  key: WeatherThemeKey;
  phase: DayPhase;
  mood: WeatherMood;
  background: string;
  heroGradient: string;
  sidebarCardBackground: string;
  sidebarShellBackground: string;
  cloudTone: WeatherCloudTone;
  layers: WeatherSceneLayer[];
  isDark: boolean;
  showStars: boolean;
  showRain: boolean;
  showSnow: boolean;
  showFog: boolean;
  showCloudBands: boolean;
  showSunGlow: boolean;
  showLightning: boolean;
}

interface WeatherThemeDefinition {
  background: string;
  heroGradient: string;
  cloudTone: WeatherCloudTone;
  isDark: boolean;
  layers: WeatherSceneLayer[];
}

function getWeatherThemeKey(phase: DayPhase, mood: WeatherMood): WeatherThemeKey {
  return `${phase}-${mood}` as WeatherThemeKey;
}

const WEATHER_THEME_DEFINITIONS: Record<WeatherThemeKey, WeatherThemeDefinition> = {
  "night-clear": {
    background: "linear-gradient(180deg, #0a1231 0%, #15224a 42%, #314482 100%)",
    heroGradient: "linear-gradient(140deg, rgba(41,63,121,0.9), rgba(73,103,175,0.78))",
    cloudTone: "default",
    isDark: true,
    layers: ["stars"],
  },
  "night-cloudy": {
    background: "linear-gradient(180deg, #0a1231 0%, #15224a 42%, #314482 100%)",
    heroGradient: "linear-gradient(140deg, rgba(41,63,121,0.9), rgba(73,103,175,0.78))",
    cloudTone: "cloudy",
    isDark: true,
    layers: ["stars", "cloudBands"],
  },
  "night-fog": {
    background: "linear-gradient(180deg, #0a1231 0%, #15224a 42%, #314482 100%)",
    heroGradient: "linear-gradient(140deg, rgba(41,63,121,0.9), rgba(73,103,175,0.78))",
    cloudTone: "fog",
    isDark: true,
    layers: ["cloudBands", "fog"],
  },
  "night-rain": {
    background: "linear-gradient(180deg, #080f2a 0%, #111b3f 45%, #243362 100%)",
    heroGradient: "linear-gradient(140deg, rgba(37,56,106,0.9), rgba(52,74,130,0.85))",
    cloudTone: "rain",
    isDark: true,
    layers: ["cloudBands", "rain"],
  },
  "night-snow": {
    background: "linear-gradient(180deg, #0a1231 0%, #15224a 42%, #314482 100%)",
    heroGradient: "linear-gradient(140deg, rgba(41,63,121,0.9), rgba(73,103,175,0.78))",
    cloudTone: "default",
    isDark: true,
    layers: ["snow"],
  },
  "night-thunder": {
    background:
      "radial-gradient(120% 90% at 50% 0%, rgba(108,146,214,0.22) 0%, rgba(108,146,214,0) 50%), linear-gradient(180deg, #040814 0%, #091225 28%, #132646 62%, #304a70 100%)",
    heroGradient:
      "linear-gradient(140deg, rgba(17,31,58,0.94), rgba(39,62,101,0.9) 55%, rgba(82,112,156,0.76) 100%)",
    cloudTone: "storm",
    isDark: true,
    layers: ["cloudBands", "rain", "lightning"],
  },
  "dawn-clear": {
    background: "linear-gradient(180deg, #1f3a66 0%, #34567f 38%, #4c6f95 64%, #7e7d83 100%)",
    heroGradient: "linear-gradient(140deg, rgba(58,91,136,0.88), rgba(89,121,161,0.76))",
    cloudTone: "default",
    isDark: false,
    layers: ["cloudBands"],
  },
  "dawn-cloudy": {
    background: "linear-gradient(180deg, #1f3a66 0%, #34567f 38%, #4c6f95 64%, #7e7d83 100%)",
    heroGradient: "linear-gradient(140deg, rgba(58,91,136,0.88), rgba(89,121,161,0.76))",
    cloudTone: "cloudy",
    isDark: false,
    layers: ["cloudBands"],
  },
  "dawn-fog": {
    background: "linear-gradient(180deg, #1f3a66 0%, #34567f 38%, #4c6f95 64%, #7e7d83 100%)",
    heroGradient: "linear-gradient(140deg, rgba(58,91,136,0.88), rgba(89,121,161,0.76))",
    cloudTone: "fog",
    isDark: false,
    layers: ["cloudBands", "fog"],
  },
  "dawn-rain": {
    background: "linear-gradient(180deg, #1f3a66 0%, #34567f 38%, #4c6f95 64%, #7e7d83 100%)",
    heroGradient: "linear-gradient(140deg, rgba(58,91,136,0.88), rgba(89,121,161,0.76))",
    cloudTone: "rain",
    isDark: false,
    layers: ["cloudBands", "rain"],
  },
  "dawn-snow": {
    background: "linear-gradient(180deg, #1f3a66 0%, #34567f 38%, #4c6f95 64%, #7e7d83 100%)",
    heroGradient: "linear-gradient(140deg, rgba(58,91,136,0.88), rgba(89,121,161,0.76))",
    cloudTone: "default",
    isDark: false,
    layers: ["cloudBands", "snow"],
  },
  "dawn-thunder": {
    background:
      "radial-gradient(115% 80% at 52% 0%, rgba(177,201,230,0.18) 0%, rgba(177,201,230,0) 48%), linear-gradient(180deg, #162740 0%, #34506d 38%, #61738a 72%, #8b8c90 100%)",
    heroGradient:
      "linear-gradient(140deg, rgba(38,61,90,0.92), rgba(79,102,128,0.82) 56%, rgba(129,141,152,0.72) 100%)",
    cloudTone: "storm",
    isDark: false,
    layers: ["cloudBands", "rain", "lightning"],
  },
  "day-clear": {
    background: "linear-gradient(180deg, #2e5786 0%, #3f6998 44%, #537cad 100%)",
    heroGradient: "linear-gradient(140deg, rgba(58,95,142,0.88), rgba(92,124,164,0.76))",
    cloudTone: "default",
    isDark: false,
    layers: ["sunGlow"],
  },
  "day-cloudy": {
    background: "linear-gradient(180deg, #2e5786 0%, #3f6998 44%, #537cad 100%)",
    heroGradient: "linear-gradient(140deg, rgba(58,95,142,0.88), rgba(92,124,164,0.76))",
    cloudTone: "cloudy",
    isDark: false,
    layers: ["cloudBands"],
  },
  "day-fog": {
    background: "linear-gradient(180deg, #3d5068 0%, #566d86 48%, #70869d 100%)",
    heroGradient: "linear-gradient(140deg, rgba(72,98,127,0.86), rgba(104,127,152,0.74))",
    cloudTone: "fog",
    isDark: false,
    layers: ["cloudBands", "fog"],
  },
  "day-rain": {
    background:
      "radial-gradient(118% 78% at 50% 2%, rgba(190,214,244,0.14) 0%, rgba(190,214,244,0) 46%), linear-gradient(180deg, #2a4764 0%, #41617e 40%, #6784a0 100%)",
    heroGradient:
      "linear-gradient(140deg, rgba(52,80,110,0.92), rgba(86,114,144,0.82) 58%, rgba(127,153,178,0.72) 100%)",
    cloudTone: "rain",
    isDark: false,
    layers: ["cloudBands", "rain"],
  },
  "day-snow": {
    background: "linear-gradient(180deg, #314663 0%, #4f647f 42%, #73879f 100%)",
    heroGradient: "linear-gradient(140deg, rgba(71,94,123,0.9), rgba(111,132,154,0.78))",
    cloudTone: "default",
    isDark: false,
    layers: ["snow"],
  },
  "day-thunder": {
    background:
      "radial-gradient(120% 80% at 50% 2%, rgba(182,207,242,0.16) 0%, rgba(182,207,242,0) 46%), linear-gradient(180deg, #16283d 0%, #2a425d 38%, #4a6280 72%, #7188a0 100%)",
    heroGradient:
      "linear-gradient(140deg, rgba(31,49,72,0.92), rgba(67,91,120,0.84) 58%, rgba(114,137,161,0.74) 100%)",
    cloudTone: "storm",
    isDark: true,
    layers: ["cloudBands", "rain", "lightning"],
  },
  "dusk-clear": {
    background: "linear-gradient(180deg, #18284f 0%, #2e4677 40%, #536a93 70%, #8a7a77 100%)",
    heroGradient: "linear-gradient(140deg, rgba(55,79,132,0.9), rgba(88,114,165,0.78))",
    cloudTone: "default",
    isDark: true,
    layers: ["cloudBands"],
  },
  "dusk-cloudy": {
    background: "linear-gradient(180deg, #18284f 0%, #2e4677 40%, #536a93 70%, #8a7a77 100%)",
    heroGradient: "linear-gradient(140deg, rgba(55,79,132,0.9), rgba(88,114,165,0.78))",
    cloudTone: "cloudy",
    isDark: true,
    layers: ["cloudBands"],
  },
  "dusk-fog": {
    background: "linear-gradient(180deg, #18284f 0%, #2e4677 40%, #536a93 70%, #8a7a77 100%)",
    heroGradient: "linear-gradient(140deg, rgba(55,79,132,0.9), rgba(88,114,165,0.78))",
    cloudTone: "fog",
    isDark: true,
    layers: ["cloudBands", "fog"],
  },
  "dusk-rain": {
    background: "linear-gradient(180deg, #18284f 0%, #2e4677 40%, #536a93 70%, #8a7a77 100%)",
    heroGradient: "linear-gradient(140deg, rgba(55,79,132,0.9), rgba(88,114,165,0.78))",
    cloudTone: "rain",
    isDark: true,
    layers: ["cloudBands", "rain"],
  },
  "dusk-snow": {
    background: "linear-gradient(180deg, #18284f 0%, #2e4677 40%, #536a93 70%, #8a7a77 100%)",
    heroGradient: "linear-gradient(140deg, rgba(55,79,132,0.9), rgba(88,114,165,0.78))",
    cloudTone: "default",
    isDark: true,
    layers: ["cloudBands", "snow"],
  },
  "dusk-thunder": {
    background:
      "radial-gradient(130% 90% at 48% 0%, rgba(136,164,208,0.18) 0%, rgba(136,164,208,0) 52%), linear-gradient(180deg, #101b33 0%, #243654 36%, #4f6178 72%, #7b7073 100%)",
    heroGradient:
      "linear-gradient(140deg, rgba(31,48,76,0.94), rgba(60,82,114,0.86) 58%, rgba(112,128,147,0.74) 100%)",
    cloudTone: "storm",
    isDark: true,
    layers: ["cloudBands", "rain", "lightning"],
  },
};

function hasWeatherLayer(layers: WeatherSceneLayer[], layer: WeatherSceneLayer): boolean {
  return layers.includes(layer);
}

function buildWeatherSidebarCardBackground(
  background: string,
  layers: WeatherSceneLayer[],
  cloudTone: WeatherCloudTone
): string {
  const overlays = [
    "linear-gradient(180deg, rgba(8,16,34,0.18) 0%, rgba(8,16,34,0.34) 100%)",
  ];

  if (hasWeatherLayer(layers, "fog")) {
    overlays.push(
      "linear-gradient(180deg, rgba(214,229,247,0.08) 40%, rgba(214,229,247,0.2) 100%)"
    );
  }
  if (hasWeatherLayer(layers, "cloudBands")) {
    if (cloudTone === "cloudy") {
      overlays.push(
        "radial-gradient(90px 42px at 22% 24%, rgba(255,255,255,0.2), transparent 72%), radial-gradient(120px 52px at 72% 28%, rgba(255,255,255,0.18), transparent 72%), radial-gradient(120px 46px at 48% 84%, rgba(255,255,255,0.12), transparent 72%)"
      );
    } else if (cloudTone === "fog") {
      overlays.push(
        "linear-gradient(180deg, rgba(236,241,247,0.16) 12%, rgba(236,241,247,0.04) 40%, rgba(236,241,247,0.18) 78%, rgba(236,241,247,0.28) 100%)"
      );
    } else {
      overlays.push(
        "linear-gradient(130deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.02) 56%, rgba(255,255,255,0.14) 100%)"
      );
    }
  }
  if (hasWeatherLayer(layers, "rain")) {
    overlays.push(
      "radial-gradient(1.2px 6px at 10% 18%, rgba(221,237,255,0.48), transparent 78%), radial-gradient(1.2px 6px at 22% 34%, rgba(221,237,255,0.44), transparent 78%), radial-gradient(1.2px 7px at 36% 16%, rgba(221,237,255,0.5), transparent 78%), radial-gradient(1px 5px at 48% 38%, rgba(221,237,255,0.42), transparent 78%), radial-gradient(1.2px 6px at 62% 22%, rgba(221,237,255,0.46), transparent 78%), radial-gradient(1px 5px at 74% 40%, rgba(221,237,255,0.4), transparent 78%), radial-gradient(1.2px 7px at 88% 20%, rgba(221,237,255,0.5), transparent 78%)"
    );
  }
  if (hasWeatherLayer(layers, "snow")) {
    overlays.push(
      "radial-gradient(3px 3px at 12% 22%, rgba(255,255,255,0.88), transparent 72%), radial-gradient(2.5px 2.5px at 26% 36%, rgba(255,255,255,0.78), transparent 72%), radial-gradient(3px 3px at 42% 18%, rgba(255,255,255,0.9), transparent 72%), radial-gradient(2px 2px at 58% 42%, rgba(255,255,255,0.78), transparent 72%), radial-gradient(3px 3px at 74% 24%, rgba(255,255,255,0.86), transparent 72%), radial-gradient(2.5px 2.5px at 88% 38%, rgba(255,255,255,0.8), transparent 72%)"
    );
  }
  if (hasWeatherLayer(layers, "lightning")) {
    overlays.push(
      "radial-gradient(72px 110px at 78% 14%, rgba(244,248,255,0.28), rgba(214,228,255,0.06) 34%, transparent 72%)",
      "linear-gradient(180deg, rgba(5,10,22,0.06) 0%, rgba(5,10,22,0.24) 100%)"
    );
  }
  if (hasWeatherLayer(layers, "stars")) {
    overlays.push(
      "radial-gradient(1.6px 1.6px at 12px 18px, rgba(255,255,255,0.78), transparent 60%), radial-gradient(1.3px 1.3px at 58px 32px, rgba(255,255,255,0.68), transparent 60%)"
    );
  }
  if (hasWeatherLayer(layers, "sunGlow")) {
    overlays.push(
      "radial-gradient(80px 56px at 82% 14%, rgba(255,217,125,0.22), transparent 70%)"
    );
  }

  overlays.push(background);
  return overlays.join(", ");
}

function buildWeatherSidebarShellBackground(background: string): string {
  return `linear-gradient(180deg, rgba(8,16,34,0.2) 0%, rgba(8,16,34,0.34) 100%), ${background}`;
}

interface OpenMeteoForecastUrlOptions {
  latitude: number;
  longitude: number;
  currentFields: string[];
  dailyFields?: string[];
  hourlyFields?: string[];
  forecastDays?: number;
  temperatureUnit?: "fahrenheit" | "celsius";
  windSpeedUnit?: "mph" | "kmh" | "kn";
  timezone?: string;
}

const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export function buildOpenMeteoForecastUrl({
  latitude,
  longitude,
  currentFields,
  dailyFields,
  hourlyFields,
  forecastDays = 10,
  temperatureUnit = "fahrenheit",
  windSpeedUnit = "mph",
  timezone = "auto",
}: OpenMeteoForecastUrlOptions): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: currentFields.join(","),
    temperature_unit: temperatureUnit,
    wind_speed_unit: windSpeedUnit,
    timezone,
    forecast_days: String(forecastDays),
  });

  if (dailyFields && dailyFields.length > 0) {
    params.set("daily", dailyFields.join(","));
  }
  if (hourlyFields && hourlyFields.length > 0) {
    params.set("hourly", hourlyFields.join(","));
  }

  return `${OPEN_METEO_FORECAST_URL}?${params.toString()}`;
}

export function getDayPhase(iso: string): DayPhase {
  if (!iso) return "day";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "day";
  const hour = date.getHours();
  if (hour < 5 || hour >= 20) return "night";
  if (hour < 8) return "dawn";
  if (hour < 17) return "day";
  return "dusk";
}

export function getWeatherMood(code: number): WeatherMood {
  if (code === 0) return "clear";
  if (code <= 3) return "cloudy";
  if (code <= 48) return "fog";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain";
  return "thunder";
}

export function getWeatherScene(currentTimeIso: string, weatherCode: number): WeatherScene {
  const phase = getDayPhase(currentTimeIso);
  const mood = getWeatherMood(weatherCode);
  const key = getWeatherThemeKey(phase, mood);
  const theme = WEATHER_THEME_DEFINITIONS[key];
  const layers = theme.layers;

  return {
    key,
    phase,
    mood,
    background: theme.background,
    heroGradient: theme.heroGradient,
    sidebarCardBackground: buildWeatherSidebarCardBackground(
      theme.background,
      layers,
      theme.cloudTone
    ),
    sidebarShellBackground: buildWeatherSidebarShellBackground(theme.background),
    cloudTone: theme.cloudTone,
    layers,
    isDark: theme.isDark,
    showStars: hasWeatherLayer(layers, "stars"),
    showRain: hasWeatherLayer(layers, "rain"),
    showSnow: hasWeatherLayer(layers, "snow"),
    showFog: hasWeatherLayer(layers, "fog"),
    showCloudBands: hasWeatherLayer(layers, "cloudBands"),
    showSunGlow: hasWeatherLayer(layers, "sunGlow"),
    showLightning: hasWeatherLayer(layers, "lightning"),
  };
}

export function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Showers";
  return "Thunderstorm";
}

export function getWeatherIconName(code: number): WeatherIconName {
  if (code === 0) return "sun";
  if (code <= 3) return "cloud";
  if (code <= 48) return "fog";
  if (code <= 57) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain";
  return "thunder";
}
