"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeOption = "system" | "light" | "dark";

interface ThemeCardProps {
  theme: ThemeOption;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function ThemeCard({ theme, label, isSelected, onClick }: ThemeCardProps) {
  const isLight = theme === "light";
  const isDark = theme === "dark";
  const isAuto = theme === "system";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-2 rounded-xl transition-all",
        isSelected && "ring-2 ring-blue-500"
      )}
    >
      {/* Preview */}
      <div
        className={cn(
          "w-24 h-16 rounded-lg overflow-hidden border",
          isSelected ? "border-blue-500" : "border-border"
        )}
      >
        {/* Auto - split view */}
        {isAuto && (
          <div className="w-full h-full flex">
            <div className="w-1/2 h-full bg-white flex flex-col">
              <div className="flex-1 p-1.5">
                <div className="w-full h-full rounded-sm bg-gray-100 flex flex-col p-1">
                  <div className="flex gap-0.5 mb-1">
                    <div className="w-1 h-1 rounded-full bg-red-400" />
                    <div className="w-1 h-1 rounded-full bg-yellow-400" />
                    <div className="w-1 h-1 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-sm" />
                </div>
              </div>
              <div className="h-2.5 bg-gray-200 flex items-center justify-center gap-1 px-1">
                <div className="w-1.5 h-1.5 rounded-sm bg-gray-400" />
                <div className="w-1.5 h-1.5 rounded-sm bg-gray-400" />
              </div>
            </div>
            <div className="w-1/2 h-full bg-zinc-900 flex flex-col">
              <div className="flex-1 p-1.5">
                <div className="w-full h-full rounded-sm bg-zinc-800 flex flex-col p-1">
                  <div className="flex gap-0.5 mb-1">
                    <div className="w-1 h-1 rounded-full bg-red-400" />
                    <div className="w-1 h-1 rounded-full bg-yellow-400" />
                    <div className="w-1 h-1 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-zinc-700 rounded-sm" />
                </div>
              </div>
              <div className="h-2.5 bg-zinc-800 flex items-center justify-center gap-1 px-1">
                <div className="w-1.5 h-1.5 rounded-sm bg-zinc-600" />
                <div className="w-1.5 h-1.5 rounded-sm bg-zinc-600" />
              </div>
            </div>
          </div>
        )}

        {/* Light mode */}
        {isLight && (
          <div className="w-full h-full bg-white flex flex-col">
            <div className="flex-1 p-1.5">
              <div className="w-full h-full rounded-sm bg-gray-100 flex flex-col p-1">
                <div className="flex gap-0.5 mb-1">
                  <div className="w-1 h-1 rounded-full bg-red-400" />
                  <div className="w-1 h-1 rounded-full bg-yellow-400" />
                  <div className="w-1 h-1 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-sm" />
              </div>
            </div>
            <div className="h-2.5 bg-gray-200 flex items-center justify-center gap-1 px-1">
              <div className="w-1.5 h-1.5 rounded-sm bg-gray-400" />
              <div className="w-1.5 h-1.5 rounded-sm bg-gray-400" />
            </div>
          </div>
        )}

        {/* Dark mode */}
        {isDark && (
          <div className="w-full h-full bg-zinc-900 flex flex-col">
            <div className="flex-1 p-1.5">
              <div className="w-full h-full rounded-sm bg-zinc-800 flex flex-col p-1">
                <div className="flex gap-0.5 mb-1">
                  <div className="w-1 h-1 rounded-full bg-red-400" />
                  <div className="w-1 h-1 rounded-full bg-yellow-400" />
                  <div className="w-1 h-1 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-zinc-700 rounded-sm" />
              </div>
            </div>
            <div className="h-2.5 bg-zinc-800 flex items-center justify-center gap-1 px-1">
              <div className="w-1.5 h-1.5 rounded-sm bg-zinc-600" />
              <div className="w-1.5 h-1.5 rounded-sm bg-zinc-600" />
            </div>
          </div>
        )}
      </div>
      <span className="text-xs">{label}</span>
    </button>
  );
}

export function AppearancePanel() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Appearance</span>
          <div className="flex gap-2">
            <ThemeCard
              theme="system"
              label="Auto"
              isSelected={theme === "system"}
              onClick={() => handleThemeChange("system")}
            />
            <ThemeCard
              theme="light"
              label="Light"
              isSelected={theme === "light"}
              onClick={() => handleThemeChange("light")}
            />
            <ThemeCard
              theme="dark"
              label="Dark"
              isSelected={theme === "dark"}
              onClick={() => handleThemeChange("dark")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
