"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import type { WeatherTemperatureUnit } from "@/lib/weather";

interface WeatherViewMenuProps {
  isOpen: boolean;
  onClose: () => void;
  temperatureUnit: WeatherTemperatureUnit;
  onTemperatureUnitChange: (unit: WeatherTemperatureUnit) => void;
}

const TEMPERATURE_UNITS: ReadonlyArray<{
  value: WeatherTemperatureUnit;
  symbol: string;
  label: string;
}> = [
  { value: "fahrenheit", symbol: "°F", label: "Fahrenheit" },
  { value: "celsius", symbol: "°C", label: "Celsius" },
];

export function WeatherViewMenu({
  isOpen,
  onClose,
  temperatureUnit,
  onTemperatureUnitChange,
}: WeatherViewMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Weather view options"
      className="absolute left-[120px] top-7 w-56 overflow-hidden rounded-lg border border-black/10 bg-white/95 py-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95"
    >
      {TEMPERATURE_UNITS.map((unit) => {
        const isSelected = temperatureUnit === unit.value;

        return (
          <button
            key={unit.value}
            type="button"
            role="menuitemradio"
            aria-checked={isSelected}
            onClick={() => {
              onTemperatureUnitChange(unit.value);
              onClose();
            }}
            className="flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors can-hover:hover:bg-blue-500 can-hover:hover:text-white"
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
            </span>
            <span className="ml-2 w-6 shrink-0 tabular-nums">{unit.symbol}</span>
            <span>{unit.label}</span>
          </button>
        );
      })}
    </div>
  );
}
