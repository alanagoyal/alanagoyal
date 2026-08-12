"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
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

function ThemeCard({ theme, label, isSelected, onClick }: ThemeCardProps) {
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
        "can-hover:hover:bg-muted/50",
        isSelected && "ring-2 ring-blue-500 bg-blue-500/10"
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted mb-2 relative">
        <Image
          src={thumbnailPath}
          alt={`macOS ${name}`}
          fill
          sizes="64px"
          className="object-cover"
          unoptimized
        />
      </div>
      <span className="text-xs font-medium">{name}</span>
      <span className="text-[10px] text-muted-foreground">{version}</span>
    </button>
  );
}

interface AppearancePanelProps {
  scrollToOSVersion?: boolean;
  onScrollComplete?: () => void;
}

export function AppearancePanel({ scrollToOSVersion, onScrollComplete }: AppearancePanelProps) {
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
