export type DayPhase = "night" | "dawn" | "day" | "dusk";
export type WeatherMood = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunder";
export type WeatherSceneEffect =
  | "sunGlow"
  | "stars"
  | "cloudShade"
  | "cloudBands"
  | "cloudDrift"
  | "fogDrift"
  | "fog"
  | "rainDrops"
  | "snow"
  | "lightning";
export type WeatherCloudTone = "default" | "cloudy" | "fog" | "storm";
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
  sidebarShellBackground: string;
  cloudTone: WeatherCloudTone;
  mainEffects: WeatherSceneEffect[];
  previewEffects: WeatherSceneEffect[];
  isDark: boolean;
}

interface WeatherThemeDefinition {
  background: string;
  heroGradient: string;
  cloudTone: WeatherCloudTone;
  isDark: boolean;
}

function getWeatherThemeKey(phase: DayPhase, mood: WeatherMood): WeatherThemeKey {
  return `${phase}-${mood}` as WeatherThemeKey;
}

type PhaseThemeMap = Record<DayPhase, WeatherThemeDefinition>;

function createTheme(
  background: string,
  heroGradient: string,
  cloudTone: WeatherCloudTone,
  isDark: boolean
): WeatherThemeDefinition {
  return { background, heroGradient, cloudTone, isDark };
}

const CLEAR_THEMES: PhaseThemeMap = {
  night: createTheme(
    "linear-gradient(180deg, #0a1231 0%, #15224a 42%, #314482 100%)",
    "linear-gradient(140deg, rgba(41,63,121,0.9), rgba(73,103,175,0.78))",
    "default",
    true
  ),
  dawn: createTheme(
    "linear-gradient(180deg, #1f3a66 0%, #34567f 38%, #4c6f95 64%, #7e7d83 100%)",
    "linear-gradient(140deg, rgba(58,91,136,0.88), rgba(89,121,161,0.76))",
    "default",
    false
  ),
  day: createTheme(
    "linear-gradient(180deg, #2e5786 0%, #3f6998 44%, #537cad 100%)",
    "linear-gradient(140deg, rgba(58,95,142,0.88), rgba(92,124,164,0.76))",
    "default",
    false
  ),
  dusk: createTheme(
    "linear-gradient(180deg, #18284f 0%, #2e4677 40%, #536a93 70%, #8a7a77 100%)",
    "linear-gradient(140deg, rgba(55,79,132,0.9), rgba(88,114,165,0.78))",
    "default",
    true
  ),
};

const CLOUDY_THEMES: PhaseThemeMap = {
  night: createTheme(
    "linear-gradient(180deg, #081028 0%, #121d40 40%, #263967 100%)",
    "linear-gradient(140deg, rgba(30,45,90,0.94), rgba(54,78,132,0.82))",
    "cloudy",
    true
  ),
  dawn: createTheme(
    "linear-gradient(180deg, #233f67 0%, #35516f 38%, #52687f 68%, #7b7f86 100%)",
    "linear-gradient(140deg, rgba(55,83,119,0.92), rgba(86,112,142,0.8))",
    "cloudy",
    false
  ),
  day: createTheme(
    "linear-gradient(180deg, #3d5778 0%, #556f8f 42%, #7088a3 100%)",
    "linear-gradient(140deg, rgba(73,101,131,0.9), rgba(103,128,151,0.8))",
    "cloudy",
    false
  ),
  dusk: createTheme(
    "linear-gradient(180deg, #162544 0%, #2c4166 40%, #4c5f7a 72%, #797274 100%)",
    "linear-gradient(140deg, rgba(46,69,106,0.92), rgba(77,100,132,0.8))",
    "cloudy",
    true
  ),
};

const FOG_THEMES: PhaseThemeMap = {
  night: createTheme(
    "linear-gradient(180deg, #0a1231 0%, #18254d 42%, #3e5282 100%)",
    "linear-gradient(140deg, rgba(47,69,124,0.9), rgba(86,114,171,0.76))",
    "fog",
    true
  ),
  dawn: createTheme(
    "linear-gradient(180deg, #24406c 0%, #3d5e86 38%, #5b7a9b 64%, #888588 100%)",
    "linear-gradient(140deg, rgba(71,103,145,0.88), rgba(109,137,172,0.74))",
    "fog",
    false
  ),
  day: createTheme(
    "linear-gradient(180deg, #355f8d 0%, #4b74a1 44%, #6c8daf 100%)",
    "linear-gradient(140deg, rgba(82,120,164,0.86), rgba(118,148,184,0.74))",
    "fog",
    false
  ),
  dusk: createTheme(
    "linear-gradient(180deg, #1d2d55 0%, #365080 40%, #617493 70%, #8f817e 100%)",
    "linear-gradient(140deg, rgba(66,92,140,0.88), rgba(103,128,173,0.74))",
    "fog",
    true
  ),
};

const SNOW_THEMES: PhaseThemeMap = {
  night: { ...CLEAR_THEMES.night },
  dawn: { ...CLEAR_THEMES.dawn },
  day: createTheme(
    "linear-gradient(180deg, #314663 0%, #4f647f 42%, #73879f 100%)",
    "linear-gradient(140deg, rgba(71,94,123,0.9), rgba(111,132,154,0.78))",
    "default",
    false
  ),
  dusk: { ...CLEAR_THEMES.dusk },
};

const RAIN_THEMES: PhaseThemeMap = {
  night: createTheme(
    SNOW_THEMES.night.background,
    "linear-gradient(140deg, rgba(38,57,89,0.92), rgba(73,97,131,0.84) 55%, rgba(125,149,177,0.74) 100%)",
    "storm",
    true
  ),
  dawn: createTheme(
    SNOW_THEMES.dawn.background,
    "linear-gradient(140deg, rgba(76,100,129,0.9), rgba(118,139,161,0.8) 56%, rgba(169,178,184,0.72) 100%)",
    "storm",
    false
  ),
  day: createTheme(
    SNOW_THEMES.day.background,
    "linear-gradient(140deg, rgba(97,124,151,0.88), rgba(134,159,180,0.8) 58%, rgba(185,201,211,0.72) 100%)",
    "storm",
    false
  ),
  dusk: createTheme(
    SNOW_THEMES.dusk.background,
    "linear-gradient(140deg, rgba(69,94,124,0.9), rgba(107,128,151,0.82) 58%, rgba(151,161,169,0.72) 100%)",
    "storm",
    true
  ),
};

const THUNDER_THEMES: PhaseThemeMap = {
  night: createTheme(
    "radial-gradient(120% 90% at 50% 0%, rgba(108,146,214,0.22) 0%, rgba(108,146,214,0) 50%), linear-gradient(180deg, #040814 0%, #091225 28%, #132646 62%, #304a70 100%)",
    "linear-gradient(140deg, rgba(17,31,58,0.94), rgba(39,62,101,0.9) 55%, rgba(82,112,156,0.76) 100%)",
    "storm",
    true
  ),
  dawn: createTheme(
    "radial-gradient(115% 80% at 52% 0%, rgba(177,201,230,0.18) 0%, rgba(177,201,230,0) 48%), linear-gradient(180deg, #162740 0%, #34506d 38%, #61738a 72%, #8b8c90 100%)",
    "linear-gradient(140deg, rgba(38,61,90,0.92), rgba(79,102,128,0.82) 56%, rgba(129,141,152,0.72) 100%)",
    "storm",
    false
  ),
  day: createTheme(
    "radial-gradient(120% 80% at 50% 2%, rgba(182,207,242,0.16) 0%, rgba(182,207,242,0) 46%), linear-gradient(180deg, #16283d 0%, #2a425d 38%, #4a6280 72%, #7188a0 100%)",
    "linear-gradient(140deg, rgba(31,49,72,0.92), rgba(67,91,120,0.84) 58%, rgba(114,137,161,0.74) 100%)",
    "storm",
    true
  ),
  dusk: createTheme(
    "radial-gradient(130% 90% at 48% 0%, rgba(136,164,208,0.18) 0%, rgba(136,164,208,0) 52%), linear-gradient(180deg, #101b33 0%, #243654 36%, #4f6178 72%, #7b7073 100%)",
    "linear-gradient(140deg, rgba(31,48,76,0.94), rgba(60,82,114,0.86) 58%, rgba(112,128,147,0.74) 100%)",
    "storm",
    true
  ),
};

// Grouping themes by phase/mood keeps palette tweaks local and makes shared backgrounds explicit.
const WEATHER_THEMES_BY_MOOD: Record<WeatherMood, PhaseThemeMap> = {
  clear: CLEAR_THEMES,
  cloudy: CLOUDY_THEMES,
  fog: FOG_THEMES,
  rain: RAIN_THEMES,
  snow: SNOW_THEMES,
  thunder: THUNDER_THEMES,
};

const STORM_RAIN_EFFECTS = ["cloudBands", "rainDrops"] as const satisfies readonly WeatherSceneEffect[];

function getWeatherSurfaceEffects(
  phase: DayPhase,
  mood: WeatherMood,
  surface: "main" | "preview"
): WeatherSceneEffect[] {
  if (mood === "thunder") {
    return surface === "main" ? [...STORM_RAIN_EFFECTS, "lightning"] : [...STORM_RAIN_EFFECTS];
  }

  if (mood === "rain") {
    return [...STORM_RAIN_EFFECTS];
  }

  if (mood === "fog") {
    return surface === "main"
      ? ["cloudShade", "cloudBands", "fog", "fogDrift"]
      : ["cloudShade", "fog"];
  }

  if (mood === "cloudy") {
    return surface === "main"
      ? ["cloudShade", "cloudBands", "cloudDrift"]
      : ["cloudShade", "cloudBands"];
  }

  if (mood === "snow") {
    if (phase === "dawn" || phase === "dusk") {
      return ["cloudBands", "snow"];
    }
    return ["snow"];
  }

  if (phase === "night") {
    if (mood === "clear") return ["stars"];
  }

  if (phase === "dawn" || phase === "dusk") {
    return ["cloudBands"];
  }

  if (phase === "day" && mood === "clear") {
    return ["sunGlow"];
  }

  return [];
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
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain";
  return "thunder";
}

export function getWeatherScene(currentTimeIso: string, weatherCode: number): WeatherScene {
  const phase = getDayPhase(currentTimeIso);
  const mood = getWeatherMood(weatherCode);
  const visualMood = mood;
  const key = getWeatherThemeKey(phase, visualMood);
  const theme = WEATHER_THEMES_BY_MOOD[visualMood][phase];
  const mainEffects = getWeatherSurfaceEffects(phase, visualMood, "main");
  const previewEffects = getWeatherSurfaceEffects(phase, visualMood, "preview");

  return {
    key,
    phase,
    mood,
    background: theme.background,
    heroGradient: theme.heroGradient,
    sidebarShellBackground: buildWeatherSidebarShellBackground(theme.background),
    cloudTone: theme.cloudTone,
    mainEffects,
    previewEffects,
    isDark: theme.isDark,
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
