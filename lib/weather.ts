export type DayPhase = "night" | "dawn" | "day" | "dusk";
export type WeatherMood = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunder";
export type WeatherIconName =
  | "sun"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder";

export interface WeatherScene {
  background: string;
  heroGradient: string;
  isDark: boolean;
  showStars: boolean;
  showRain: boolean;
  showFog: boolean;
  showCloudBands: boolean;
  showSunGlow: boolean;
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

  const showStars = phase === "night" && (mood === "clear" || mood === "cloudy");
  const showRain = mood === "rain" || mood === "thunder";
  const showFog = mood === "fog";
  const showCloudBands = mood === "cloudy" || mood === "rain" || mood === "fog";
  const showSunGlow = phase === "day" && mood === "clear";

  if (phase === "night") {
    if (mood === "rain" || mood === "thunder") {
      return {
        background: "linear-gradient(180deg, #080f2a 0%, #111b3f 45%, #243362 100%)",
        heroGradient: "linear-gradient(140deg, rgba(37,56,106,0.9), rgba(52,74,130,0.85))",
        isDark: true,
        showStars,
        showRain,
        showFog,
        showCloudBands: true,
        showSunGlow: false,
      };
    }
    return {
      background: "linear-gradient(180deg, #0a1231 0%, #15224a 42%, #314482 100%)",
      heroGradient: "linear-gradient(140deg, rgba(41,63,121,0.9), rgba(73,103,175,0.78))",
      isDark: true,
      showStars,
      showRain,
      showFog,
      showCloudBands,
      showSunGlow: false,
    };
  }

  if (phase === "dusk") {
    return {
      background: "linear-gradient(180deg, #18284f 0%, #2e4677 40%, #536a93 70%, #8a7a77 100%)",
      heroGradient: "linear-gradient(140deg, rgba(55,79,132,0.9), rgba(88,114,165,0.78))",
      isDark: true,
      showStars: false,
      showRain,
      showFog,
      showCloudBands: true,
      showSunGlow: false,
    };
  }

  if (phase === "dawn") {
    return {
      background: "linear-gradient(180deg, #1f3a66 0%, #34567f 38%, #4c6f95 64%, #7e7d83 100%)",
      heroGradient: "linear-gradient(140deg, rgba(58,91,136,0.88), rgba(89,121,161,0.76))",
      isDark: false,
      showStars: false,
      showRain,
      showFog,
      showCloudBands: true,
      showSunGlow: false,
    };
  }

  if (mood === "fog") {
    return {
      background: "linear-gradient(180deg, #3d5068 0%, #566d86 48%, #70869d 100%)",
      heroGradient: "linear-gradient(140deg, rgba(72,98,127,0.86), rgba(104,127,152,0.74))",
      isDark: false,
      showStars: false,
      showRain: false,
      showFog: true,
      showCloudBands: true,
      showSunGlow: false,
    };
  }

  if (mood === "rain" || mood === "thunder") {
    return {
      background: "linear-gradient(180deg, #264561 0%, #355a79 42%, #4a6f8f 100%)",
      heroGradient: "linear-gradient(140deg, rgba(49,81,118,0.9), rgba(79,112,146,0.78))",
      isDark: false,
      showStars: false,
      showRain: true,
      showFog: false,
      showCloudBands: true,
      showSunGlow: false,
    };
  }

  return {
    background: "linear-gradient(180deg, #2e5786 0%, #3f6998 44%, #537cad 100%)",
    heroGradient: "linear-gradient(140deg, rgba(58,95,142,0.88), rgba(92,124,164,0.76))",
    isDark: false,
    showStars: false,
    showRain: false,
    showFog: false,
    showCloudBands,
    showSunGlow,
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
