"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { soundEffects } from "@/lib/messages/sound-effects";

export type AirdropMode = "contacts" | "everyone";
export type FocusMode = "off" | "doNotDisturb" | "sleep" | "reduceInterruptions";

interface SystemSettingsContextValue {
  brightness: number;
  setBrightness: (value: number) => void;
  volume: number;
  setVolume: (value: number) => void;
  airdropMode: AirdropMode;
  setAirdropMode: (mode: AirdropMode) => void;
  focusMode: FocusMode;
  setFocusMode: (mode: FocusMode) => void;
}

const SystemSettingsContext = createContext<SystemSettingsContextValue | null>(null);

const BRIGHTNESS_KEY = "system-brightness";
const AIRDROP_KEY = "system-airdrop";
const FOCUS_KEY = "system-focus";

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const [brightness, setBrightnessState] = useState(100);
  const [volume, setVolumeState] = useState(50);
  const [airdropMode, setAirdropModeState] = useState<AirdropMode>("contacts");
  const [focusMode, setFocusModeState] = useState<FocusMode>("off");

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedBrightness = localStorage.getItem(BRIGHTNESS_KEY);
      if (storedBrightness) {
        setBrightnessState(parseFloat(storedBrightness));
      }
      // Volume is loaded from soundEffects
      setVolumeState(soundEffects.getVolume() * 100);

      const storedAirdrop = localStorage.getItem(AIRDROP_KEY);
      if (storedAirdrop === "contacts" || storedAirdrop === "everyone") {
        setAirdropModeState(storedAirdrop);
      }

      const storedFocus = localStorage.getItem(FOCUS_KEY);
      if (storedFocus === "off" || storedFocus === "doNotDisturb" || storedFocus === "sleep" || storedFocus === "reduceInterruptions") {
        setFocusModeState(storedFocus);
      }
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

  return (
    <SystemSettingsContext.Provider value={{ brightness, setBrightness, volume, setVolume, airdropMode, setAirdropMode, focusMode, setFocusMode }}>
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
