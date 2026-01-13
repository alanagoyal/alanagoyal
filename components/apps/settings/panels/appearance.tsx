"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useSystemSettings } from "@/lib/system-settings-context";
import { OS_VERSIONS, getThumbnailPath } from "@/lib/os-versions";

type ThemeOption = "system" | "light" | "dark";

interface ThemeCardProps {
  theme: ThemeOption;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  isMobile?: boolean;
}

// Mobile phone preview component
function MobilePhonePreview({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={cn(
        "w-20 h-40 rounded-2xl overflow-hidden border-2 border-gray-300",
        isDark ? "bg-zinc-900" : "bg-white"
      )}
    >
      {/* Status bar */}
      <div className={cn(
        "h-5 flex items-center justify-center text-[8px] font-semibold",
        isDark ? "text-white" : "text-black"
      )}>
        9:41
      </div>
      {/* Screen content - gradient wallpaper */}
      <div className="flex-1 h-28 relative overflow-hidden">
        <div className={cn(
          "absolute inset-0",
          isDark
            ? "bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700"
            : "bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-200"
        )} />
        {/* Floating elements to simulate wallpaper */}
        <div className={cn(
          "absolute top-4 left-2 w-8 h-8 rounded-full opacity-50",
          isDark ? "bg-blue-700" : "bg-blue-300"
        )} />
        <div className={cn(
          "absolute bottom-6 right-2 w-12 h-12 rounded-full opacity-40",
          isDark ? "bg-teal-600" : "bg-teal-200"
        )} />
      </div>
      {/* Dock */}
      <div className={cn(
        "h-7 flex items-center justify-center gap-1 px-2",
        isDark ? "bg-zinc-800/80" : "bg-gray-200/80"
      )}>
        <div className={cn("w-4 h-4 rounded", isDark ? "bg-zinc-600" : "bg-gray-300")} />
        <div className={cn("w-4 h-4 rounded", isDark ? "bg-zinc-600" : "bg-gray-300")} />
        <div className={cn("w-4 h-4 rounded", isDark ? "bg-zinc-600" : "bg-gray-300")} />
      </div>
    </div>
  );
}

// Desktop preview component
function DesktopPreview({ theme }: { theme: ThemeOption }) {
  const isLight = theme === "light";
  const isDark = theme === "dark";
  const isAuto = theme === "system";

  return (
    <div className="w-24 h-16 rounded-lg overflow-hidden border border-border">
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
  );
}

function ThemeCard({ theme, label, isSelected, onClick, isMobile = false }: ThemeCardProps) {
  const isLight = theme === "light";
  const isDark = theme === "dark";

  if (isMobile && theme !== "system") {
    // Mobile layout: vertical card with phone preview and checkmark
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-3"
      >
        <MobilePhonePreview isDark={isDark} />
        <span className="text-base font-medium">{label}</span>
        {/* Checkmark circle */}
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            isSelected
              ? "bg-blue-500"
              : "border-2 border-gray-300"
          )}
        >
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </div>
      </button>
    );
  }

  // Desktop layout
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-2 rounded-xl transition-all",
        isSelected && "ring-2 ring-blue-500"
      )}
    >
      <DesktopPreview theme={theme} />
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

function OSVersionCard({
  osId,
  name,
  version,
  isSelected,
  onClick,
}: {
  osId: string;
  name: string;
  version: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const thumbnailPath = getThumbnailPath(osId);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center p-3 rounded-xl transition-all",
        "hover:bg-muted/50",
        isSelected && "ring-2 ring-blue-500 bg-blue-500/10"
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailPath}
          alt={`macOS ${name}`}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-xs font-medium">{name}</span>
      <span className="text-[10px] text-muted-foreground">{version}</span>
    </button>
  );
}

interface AppearancePanelProps {
  isMobile?: boolean;
  scrollToOSVersion?: boolean;
  onScrollComplete?: () => void;
}

export function AppearancePanel({ isMobile = false, scrollToOSVersion, onScrollComplete }: AppearancePanelProps) {
  const { theme, setTheme } = useTheme();
  const { osVersionId, setOSVersionId } = useSystemSettings();
  const osVersionRef = useRef<HTMLDivElement>(null);

  // Scroll to OS version section when requested
  useEffect(() => {
    if (scrollToOSVersion && osVersionRef.current) {
      // Small delay to ensure the panel is rendered
      setTimeout(() => {
        osVersionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        onScrollComplete?.();
      }, 100);
    }
  }, [scrollToOSVersion, onScrollComplete]);

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
  };

  const isAutomatic = theme === "system";

  if (isMobile) {
    return (
      <div className="space-y-4 px-4">
        {/* Section header */}
        <p className="text-sm text-muted-foreground uppercase tracking-wide px-2">
          Appearance
        </p>

        {/* Theme cards in rounded container */}
        <div className="rounded-xl bg-background p-6">
          <div className="flex justify-center gap-12">
            <ThemeCard
              theme="light"
              label="Light"
              isSelected={theme === "light" || (theme === "system" && typeof window !== "undefined" && !window.matchMedia("(prefers-color-scheme: dark)").matches)}
              onClick={() => handleThemeChange("light")}
              isMobile={true}
            />
            <ThemeCard
              theme="dark"
              label="Dark"
              isSelected={theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)}
              onClick={() => handleThemeChange("dark")}
              isMobile={true}
            />
          </div>
        </div>

        {/* Automatic toggle */}
        <div className="rounded-xl bg-background">
          <div className="flex items-center justify-between p-4">
            <span className="text-base">Automatic</span>
            <button
              onClick={() => handleThemeChange(isAutomatic ? "light" : "system")}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                isAutomatic ? "bg-green-500" : "bg-gray-300"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform",
                  isAutomatic ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* macOS Version section */}
        <div ref={osVersionRef} className="pt-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide px-2">
            macOS Version
          </p>
        </div>
        <div className="rounded-xl bg-background p-4">
          <div className="grid grid-cols-3 gap-2">
            {OS_VERSIONS.map((os) => (
              <OSVersionCard
                key={os.id}
                osId={os.id}
                name={os.name}
                version={os.version}
                isSelected={os.id === osVersionId}
                onClick={() => setOSVersionId(os.id)}
                              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs">Appearance</span>
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

      {/* macOS Version section */}
      <div ref={osVersionRef} className="rounded-xl bg-muted/50 p-4">
        <h3 className="text-xs font-medium mb-3">macOS Version</h3>
        <div className="grid grid-cols-4 gap-3">
          {OS_VERSIONS.map((os) => (
            <OSVersionCard
              key={os.id}
              osId={os.id}
              name={os.name}
              version={os.version}
              isSelected={os.id === osVersionId}
              onClick={() => setOSVersionId(os.id)}
                          />
          ))}
        </div>
      </div>
    </div>
  );
}
