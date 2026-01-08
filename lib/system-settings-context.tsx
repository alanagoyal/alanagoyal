"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { soundEffects } from "@/lib/messages/sound-effects";

interface SystemSettingsContextValue {
  brightness: number;
  setBrightness: (value: number) => void;
  volume: number;
  setVolume: (value: number) => void;
}

const SystemSettingsContext = createContext<SystemSettingsContextValue | null>(null);

const BRIGHTNESS_KEY = "system-brightness";

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const [brightness, setBrightnessState] = useState(100);
  const [volume, setVolumeState] = useState(50);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedBrightness = localStorage.getItem(BRIGHTNESS_KEY);
      if (storedBrightness) {
        setBrightnessState(parseFloat(storedBrightness));
      }
      // Volume is loaded from soundEffects
      setVolumeState(soundEffects.getVolume() * 100);
    }
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

  return (
    <SystemSettingsContext.Provider value={{ brightness, setBrightness, volume, setVolume }}>
      {children}
      {/* Brightness overlay - below menus (z-1000) but above content */}
      {brightness < 100 && (
        <div
          className="fixed inset-0 bg-black pointer-events-none z-[100]"
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
