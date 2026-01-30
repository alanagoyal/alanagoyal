"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { soundEffects } from "@/lib/messages/sound-effects";
import { OSVersion, getOSVersion, DEFAULT_OS_VERSION_ID } from "@/lib/os-versions";

export type AirdropMode = "contacts" | "everyone";
export type FocusMode = "off" | "doNotDisturb" | "sleep" | "reduceInterruptions";

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
      osVersionId: DEFAULT_OS_VERSION_ID,
    };
  }

  const storedBrightness = localStorage.getItem(BRIGHTNESS_KEY);
  const storedWifi = localStorage.getItem(WIFI_KEY);
  const storedBluetooth = localStorage.getItem(BLUETOOTH_KEY);
  const storedAirdrop = localStorage.getItem(AIRDROP_KEY);
  const storedFocus = localStorage.getItem(FOCUS_KEY);
  const storedOSVersion = localStorage.getItem(OS_VERSION_KEY);

  return {
    brightness: storedBrightness ? parseFloat(storedBrightness) : 100,
    wifiEnabled: storedWifi === null ? true : storedWifi === "true",
    bluetoothEnabled: storedBluetooth === null ? true : storedBluetooth === "true",
    airdropMode: (storedAirdrop === "contacts" || storedAirdrop === "everyone" ? storedAirdrop : "contacts") as AirdropMode,
    focusMode: (storedFocus === "off" || storedFocus === "doNotDisturb" || storedFocus === "sleep" || storedFocus === "reduceInterruptions" ? storedFocus : "off") as FocusMode,
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
    if (typeof window !== "undefined") {
      localStorage.setItem(FOCUS_KEY, mode);
    }
  }, []);

  const setOSVersionId = useCallback((id: string) => {
    setOSVersionIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(OS_VERSION_KEY, id);
    }
  }, []);

  const currentOS = useMemo(() => getOSVersion(osVersionId), [osVersionId]);

  return (
    <SystemSettingsContext.Provider value={{ brightness, setBrightness, volume, setVolume, wifiEnabled, setWifiEnabled, bluetoothEnabled, setBluetoothEnabled, airdropMode, setAirdropMode, focusMode, setFocusMode, osVersionId, setOSVersionId, currentOS }}>
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
  osVersionId: DEFAULT_OS_VERSION_ID,
  setOSVersionId: () => {},
  currentOS: getOSVersion(DEFAULT_OS_VERSION_ID),
};

export function useSystemSettingsSafe(): SystemSettingsContextValue {
  const context = useContext(SystemSettingsContext);
  return context || defaultSettings;
}
