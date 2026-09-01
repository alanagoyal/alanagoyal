"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { soundEffects } from "@/lib/messages/sound-effects";
import { OSVersion, getOSVersion, DEFAULT_OS_VERSION_ID } from "@/lib/os-versions";
import {
  DOCK_SHOW_OPEN_INDICATORS_STORAGE_KEY,
  parseShowDockIndicators,
} from "@/lib/dock-preferences";

export type AirdropMode = "contacts" | "everyone";
export type FocusMode = "off" | "doNotDisturb" | "sleep" | "reduceInterruptions";
export type ClockStyle = "digital" | "analog";

interface SystemSettingsContextValue {
  brightness: number;
  setBrightness: (value: number) => void;
  volume: number;
  setVolume: (value: number) => void;
  wifiEnabled: boolean;
  setWifiEnabled: (enabled: boolean) => void;
  bluetoothEnabled: boolean;
  setBluetoothEnabled: (enabled: boolean) => void;
  airdropMode: AirdropMode;
  setAirdropMode: (mode: AirdropMode) => void;
  focusMode: FocusMode;
  setFocusMode: (mode: FocusMode) => void;
  focusEndsAt: number | null;
  scheduleFocusEnd: (timestamp: number) => void;
  menuBarBackground: boolean;
  setMenuBarBackground: (show: boolean) => void;
  clockShowDate: boolean;
  setClockShowDate: (show: boolean) => void;
  clockShowDayOfWeek: boolean;
  setClockShowDayOfWeek: (show: boolean) => void;
  clockStyle: ClockStyle;
  setClockStyle: (style: ClockStyle) => void;
  clockShowAmPm: boolean;
  setClockShowAmPm: (show: boolean) => void;
  clockFlashSeparators: boolean;
  setClockFlashSeparators: (flash: boolean) => void;
  clockShowSeconds: boolean;
  setClockShowSeconds: (show: boolean) => void;
  showDockIndicators: boolean;
  setShowDockIndicators: (show: boolean) => void;
  wallpaperUrl: string | null;
  setWallpaperUrl: (url: string | null) => void;
  osVersionId: string;
  setOSVersionId: (id: string) => void;
  currentOS: OSVersion;
}

const SystemSettingsContext = createContext<SystemSettingsContextValue | null>(null);

const BRIGHTNESS_KEY = "system-brightness";
const WIFI_KEY = "settings-wifi-enabled";
const BLUETOOTH_KEY = "settings-bluetooth-enabled";
const AIRDROP_KEY = "system-airdrop";
const FOCUS_KEY = "system-focus";
const FOCUS_ENDS_AT_KEY = "desktop-focus-ends-at";
const MENU_BAR_BACKGROUND_KEY = "menu-bar-show-background";
const CLOCK_SHOW_DATE_KEY = "menu-bar-clock-show-date";
const CLOCK_SHOW_DAY_KEY = "menu-bar-clock-show-day";
const CLOCK_STYLE_KEY = "menu-bar-clock-style";
const CLOCK_SHOW_AM_PM_KEY = "menu-bar-clock-show-am-pm";
const CLOCK_FLASH_SEPARATORS_KEY = "menu-bar-clock-flash-separators";
const CLOCK_SHOW_SECONDS_KEY = "menu-bar-clock-show-seconds";
const WALLPAPER_URL_KEY = "desktop-custom-wallpaper";
const OS_VERSION_KEY = "system-os-version";

// Helper to load settings from localStorage synchronously
function getInitialSettings() {
  if (typeof window === "undefined") {
    return {
      brightness: 100,
      wifiEnabled: true,
      bluetoothEnabled: true,
      airdropMode: "contacts" as AirdropMode,
      focusMode: "off" as FocusMode,
      focusEndsAt: null,
      menuBarBackground: false,
      clockShowDate: true,
      clockShowDayOfWeek: true,
      clockStyle: "digital" as ClockStyle,
      clockShowAmPm: true,
      clockFlashSeparators: false,
      clockShowSeconds: false,
      showDockIndicators: true,
      wallpaperUrl: null,
      osVersionId: DEFAULT_OS_VERSION_ID,
    };
  }

  const storedBrightness = localStorage.getItem(BRIGHTNESS_KEY);
  const storedWifi = localStorage.getItem(WIFI_KEY);
  const storedBluetooth = localStorage.getItem(BLUETOOTH_KEY);
  const storedAirdrop = localStorage.getItem(AIRDROP_KEY);
  const storedFocus = localStorage.getItem(FOCUS_KEY);
  const storedFocusEndsAt = localStorage.getItem(FOCUS_ENDS_AT_KEY);
  const storedClockStyle = localStorage.getItem(CLOCK_STYLE_KEY);
  const storedClockShowSeconds = localStorage.getItem(CLOCK_SHOW_SECONDS_KEY);
  const storedWallpaperUrl = localStorage.getItem(WALLPAPER_URL_KEY);
  const storedOSVersion = localStorage.getItem(OS_VERSION_KEY);
  const parsedFocusEndsAt = storedFocusEndsAt
    ? Number(storedFocusEndsAt)
    : null;

  return {
    brightness: storedBrightness ? parseFloat(storedBrightness) : 100,
    wifiEnabled: storedWifi === null ? true : storedWifi === "true",
    bluetoothEnabled: storedBluetooth === null ? true : storedBluetooth === "true",
    airdropMode: (storedAirdrop === "contacts" || storedAirdrop === "everyone" ? storedAirdrop : "contacts") as AirdropMode,
    focusMode: (storedFocus === "off" || storedFocus === "doNotDisturb" || storedFocus === "sleep" || storedFocus === "reduceInterruptions" ? storedFocus : "off") as FocusMode,
    focusEndsAt:
      parsedFocusEndsAt !== null && Number.isFinite(parsedFocusEndsAt)
        ? parsedFocusEndsAt
        : null,
    menuBarBackground: localStorage.getItem(MENU_BAR_BACKGROUND_KEY) === "true",
    clockShowDate: localStorage.getItem(CLOCK_SHOW_DATE_KEY) !== "false",
    clockShowDayOfWeek: localStorage.getItem(CLOCK_SHOW_DAY_KEY) !== "false",
    clockStyle: (storedClockStyle === "analog" ? "analog" : "digital") as ClockStyle,
    clockShowAmPm: localStorage.getItem(CLOCK_SHOW_AM_PM_KEY) !== "false",
    clockFlashSeparators: localStorage.getItem(CLOCK_FLASH_SEPARATORS_KEY) === "true",
    clockShowSeconds: storedClockShowSeconds === "true",
    showDockIndicators: parseShowDockIndicators(
      localStorage.getItem(DOCK_SHOW_OPEN_INDICATORS_STORAGE_KEY)
    ),
    wallpaperUrl: storedWallpaperUrl || null,
    osVersionId: storedOSVersion || DEFAULT_OS_VERSION_ID,
  };
}

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  // Cache initial settings to avoid multiple localStorage reads
  const initialSettingsRef = React.useRef<ReturnType<typeof getInitialSettings> | null>(null);
  if (initialSettingsRef.current === null) {
    initialSettingsRef.current = getInitialSettings();
  }
  const initial = initialSettingsRef.current;

  // Load all settings synchronously from localStorage to prevent flash on hydration
  const [brightness, setBrightnessState] = useState(initial.brightness);
  const [volume, setVolumeState] = useState(50);
  const [wifiEnabled, setWifiEnabledState] = useState(initial.wifiEnabled);
  const [bluetoothEnabled, setBluetoothEnabledState] = useState(initial.bluetoothEnabled);
  const [airdropMode, setAirdropModeState] = useState<AirdropMode>(initial.airdropMode);
  const [focusMode, setFocusModeState] = useState<FocusMode>(initial.focusMode);
  const [focusEndsAt, setFocusEndsAtState] = useState<number | null>(
    initial.focusEndsAt
  );
  const [menuBarBackground, setMenuBarBackgroundState] = useState(
    initial.menuBarBackground
  );
  const [clockShowDate, setClockShowDateState] = useState(initial.clockShowDate);
  const [clockShowDayOfWeek, setClockShowDayOfWeekState] = useState(
    initial.clockShowDayOfWeek
  );
  const [clockStyle, setClockStyleState] = useState<ClockStyle>(initial.clockStyle);
  const [clockShowAmPm, setClockShowAmPmState] = useState(
    initial.clockShowAmPm
  );
  const [clockFlashSeparators, setClockFlashSeparatorsState] = useState(
    initial.clockFlashSeparators
  );
  const [clockShowSeconds, setClockShowSecondsState] = useState(
    initial.clockShowSeconds
  );
  const [showDockIndicators, setShowDockIndicatorsState] = useState(
    initial.showDockIndicators
  );
  const [wallpaperUrl, setWallpaperUrlState] = useState<string | null>(
    initial.wallpaperUrl
  );
  const [osVersionId, setOSVersionIdState] = useState<string>(initial.osVersionId);

  // Load volume from soundEffects on mount (can't be done synchronously)
  useEffect(() => {
    setVolumeState(soundEffects.getVolume() * 100);
  }, []);

  const setBrightness = useCallback((value: number) => {
    const clamped = Math.max(20, Math.min(100, value)); // Min 20% to keep visible
    setBrightnessState(clamped);
    if (typeof window !== "undefined") {
      localStorage.setItem(BRIGHTNESS_KEY, clamped.toString());
    }
  }, []);

  const setVolume = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setVolumeState(clamped);
    soundEffects.setVolume(clamped / 100);
  }, []);

  const setWifiEnabled = useCallback((enabled: boolean) => {
    setWifiEnabledState(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(WIFI_KEY, String(enabled));
    }
  }, []);

  const setBluetoothEnabled = useCallback((enabled: boolean) => {
    setBluetoothEnabledState(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(BLUETOOTH_KEY, String(enabled));
    }
  }, []);

  const setAirdropMode = useCallback((mode: AirdropMode) => {
    setAirdropModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(AIRDROP_KEY, mode);
    }
  }, []);

  const setFocusMode = useCallback((mode: FocusMode) => {
    setFocusModeState(mode);
    setFocusEndsAtState(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(FOCUS_KEY, mode);
      localStorage.removeItem(FOCUS_ENDS_AT_KEY);
    }
  }, []);

  const scheduleFocusEnd = useCallback((timestamp: number) => {
    if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
      setFocusModeState("off");
      setFocusEndsAtState(null);
      if (typeof window !== "undefined") {
        localStorage.setItem(FOCUS_KEY, "off");
        localStorage.removeItem(FOCUS_ENDS_AT_KEY);
      }
      return;
    }

    setFocusEndsAtState(timestamp);
    if (typeof window !== "undefined") {
      localStorage.setItem(FOCUS_ENDS_AT_KEY, String(timestamp));
    }
  }, []);

  const expireFocus = useCallback(() => {
    setFocusModeState("off");
    setFocusEndsAtState(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(FOCUS_KEY, "off");
      localStorage.removeItem(FOCUS_ENDS_AT_KEY);
    }
  }, []);

  useEffect(() => {
    if (focusEndsAt === null) return;

    const remaining = focusEndsAt - Date.now();
    if (remaining <= 0) {
      expireFocus();
      return;
    }

    const timeout = window.setTimeout(expireFocus, remaining);
    const handleVisibilityChange = () => {
      if (!document.hidden && Date.now() >= focusEndsAt) {
        expireFocus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [expireFocus, focusEndsAt]);

  const setOSVersionId = useCallback((id: string) => {
    setOSVersionIdState(id);
    setWallpaperUrlState(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(OS_VERSION_KEY, id);
      localStorage.removeItem(WALLPAPER_URL_KEY);
    }
  }, []);

  const setWallpaperUrl = useCallback((url: string | null) => {
    setWallpaperUrlState(url);
    if (typeof window === "undefined") return;
    if (url) {
      localStorage.setItem(WALLPAPER_URL_KEY, url);
    } else {
      localStorage.removeItem(WALLPAPER_URL_KEY);
    }
  }, []);

  const setClockShowSeconds = useCallback((show: boolean) => {
    setClockShowSecondsState(show);
    if (typeof window !== "undefined") {
      localStorage.setItem(CLOCK_SHOW_SECONDS_KEY, String(show));
    }
  }, []);

  const setShowDockIndicators = useCallback((show: boolean) => {
    setShowDockIndicatorsState(show);
    if (typeof window !== "undefined") {
      localStorage.setItem(DOCK_SHOW_OPEN_INDICATORS_STORAGE_KEY, String(show));
    }
  }, []);

  const setMenuBarBackground = useCallback((show: boolean) => {
    setMenuBarBackgroundState(show);
    localStorage.setItem(MENU_BAR_BACKGROUND_KEY, String(show));
  }, []);

  const setClockShowDate = useCallback((show: boolean) => {
    setClockShowDateState(show);
    localStorage.setItem(CLOCK_SHOW_DATE_KEY, String(show));
  }, []);

  const setClockShowDayOfWeek = useCallback((show: boolean) => {
    setClockShowDayOfWeekState(show);
    localStorage.setItem(CLOCK_SHOW_DAY_KEY, String(show));
  }, []);

  const setClockStyle = useCallback((style: ClockStyle) => {
    setClockStyleState(style);
    localStorage.setItem(CLOCK_STYLE_KEY, style);
  }, []);

  const setClockShowAmPm = useCallback((show: boolean) => {
    setClockShowAmPmState(show);
    localStorage.setItem(CLOCK_SHOW_AM_PM_KEY, String(show));
  }, []);

  const setClockFlashSeparators = useCallback((flash: boolean) => {
    setClockFlashSeparatorsState(flash);
    localStorage.setItem(CLOCK_FLASH_SEPARATORS_KEY, String(flash));
  }, []);

  const currentOS = useMemo(() => getOSVersion(osVersionId), [osVersionId]);

  return (
    <SystemSettingsContext.Provider value={{ brightness, setBrightness, volume, setVolume, wifiEnabled, setWifiEnabled, bluetoothEnabled, setBluetoothEnabled, airdropMode, setAirdropMode, focusMode, setFocusMode, focusEndsAt, scheduleFocusEnd, menuBarBackground, setMenuBarBackground, clockShowDate, setClockShowDate, clockShowDayOfWeek, setClockShowDayOfWeek, clockStyle, setClockStyle, clockShowAmPm, setClockShowAmPm, clockFlashSeparators, setClockFlashSeparators, clockShowSeconds, setClockShowSeconds, showDockIndicators, setShowDockIndicators, wallpaperUrl, setWallpaperUrl, osVersionId, setOSVersionId, currentOS }}>
      {children}
      {/* Brightness overlay - dims everything below system overlays */}
      {brightness < 100 && (
        <div
          className="fixed inset-0 bg-black pointer-events-none z-[90]"
          style={{ opacity: (100 - brightness) / 100 }}
        />
      )}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings(): SystemSettingsContextValue {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error("useSystemSettings must be used within a SystemSettingsProvider");
  }
  return context;
}

// Safe version that returns defaults when outside provider (for use in AudioProvider at root level)
const defaultSettings: SystemSettingsContextValue = {
  brightness: 100,
  setBrightness: () => {},
  volume: 100,
  setVolume: () => {},
  wifiEnabled: true,
  setWifiEnabled: () => {},
  bluetoothEnabled: true,
  setBluetoothEnabled: () => {},
  airdropMode: "contacts",
  setAirdropMode: () => {},
  focusMode: "off",
  setFocusMode: () => {},
  focusEndsAt: null,
  scheduleFocusEnd: () => {},
  menuBarBackground: false,
  setMenuBarBackground: () => {},
  clockShowDate: true,
  setClockShowDate: () => {},
  clockShowDayOfWeek: true,
  setClockShowDayOfWeek: () => {},
  clockStyle: "digital",
  setClockStyle: () => {},
  clockShowAmPm: true,
  setClockShowAmPm: () => {},
  clockFlashSeparators: false,
  setClockFlashSeparators: () => {},
  clockShowSeconds: false,
  setClockShowSeconds: () => {},
  showDockIndicators: true,
  setShowDockIndicators: () => {},
  wallpaperUrl: null,
  setWallpaperUrl: () => {},
  osVersionId: DEFAULT_OS_VERSION_ID,
  setOSVersionId: () => {},
  currentOS: getOSVersion(DEFAULT_OS_VERSION_ID),
};

export function useSystemSettingsSafe(): SystemSettingsContextValue {
  const context = useContext(SystemSettingsContext);
  return context || defaultSettings;
}
