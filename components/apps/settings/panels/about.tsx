"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useSystemSettings } from "@/lib/system-settings-context";
import { getThumbnailPath } from "@/lib/os-versions";
import { SettingsCategory } from "../settings-app";

interface AboutPanelProps {
  onCategorySelect?: (category: SettingsCategory, options?: { scrollToOSVersion?: boolean }) => void;
}

export function AboutPanel({ onCategorySelect }: AboutPanelProps) {
  const { currentOS, osVersionId } = useSystemSettings();
  const thumbnailPath = getThumbnailPath(osVersionId);

  return (
    <div className="max-w-lg mx-auto py-6 px-4">
      {/* MacBook Image */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-24 mb-4">
          <svg
            viewBox="0 0 120 90"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Screen bezel */}
            <rect
              x="10"
              y="5"
              width="100"
              height="65"
              rx="4"
              className="fill-zinc-800 dark:fill-zinc-700"
            />
            {/* Screen */}
            <rect
              x="14"
              y="9"
              width="92"
              height="55"
              rx="2"
              className="fill-sky-400"
            />
            {/* Notch */}
            <rect
              x="52"
              y="5"
              width="16"
              height="4"
              rx="2"
              className="fill-zinc-900 dark:fill-zinc-600"
            />
            {/* Base */}
            <path
              d="M5 70h110l-5 8H10l-5-8z"
              className="fill-zinc-300 dark:fill-zinc-600"
            />
            {/* Trackpad indent */}
            <rect
              x="40"
              y="71"
              width="40"
              height="3"
              rx="1.5"
              className="fill-zinc-400 dark:fill-zinc-500"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">MacBook Air</h2>
        <p className="text-xs text-muted-foreground">M2, 2022</p>
      </div>

      {/* Specs Table */}
      <div className="rounded-xl bg-muted/50 overflow-hidden mb-6">
        <div className="divide-y divide-border/50">
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-muted-foreground">Name</span>
            <span className="text-xs">Alana&apos;s MacBook Air</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-muted-foreground">Chip</span>
            <span className="text-xs">Apple M2</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-muted-foreground">Memory</span>
            <span className="text-xs">24 GB</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-muted-foreground">Serial number</span>
            <span className="text-xs">L76NXH926Q</span>
          </div>
        </div>
      </div>

      {/* macOS Section */}
      <div className="mb-6">
        <h3 className="text-xs font-medium mb-3">macOS</h3>
        <div className="rounded-xl bg-muted/50 overflow-hidden">
          <button
            onClick={() => onCategorySelect?.("appearance", { scrollToOSVersion: true })}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/70 transition-colors"
          >
              <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted relative">
                <Image
                  src={thumbnailPath}
                  alt={`macOS ${currentOS.name}`}
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className="text-xs">macOS {currentOS.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Version {currentOS.version}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
