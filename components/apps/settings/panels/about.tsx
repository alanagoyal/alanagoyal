"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemSettings } from "@/lib/system-settings-context";
import { getThumbnailPath } from "@/lib/os-versions";
import { SettingsCategory } from "../settings-app";

interface AboutPanelProps {
  isMobile?: boolean;
  onCategorySelect?: (category: SettingsCategory, options?: { scrollToOSVersion?: boolean }) => void;
}

// Calculate days until AppleCare+ expiration (January 4, 2027)
function getDaysUntilExpiration(): number {
  const expirationDate = new Date(2027, 0, 4); // January 4, 2027
  const today = new Date();
  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function AboutPanel({ isMobile = false, onCategorySelect }: AboutPanelProps) {
  const daysLeft = getDaysUntilExpiration();
  const { currentOS, osVersionId } = useSystemSettings();
  const thumbnailPath = getThumbnailPath(osVersionId);

  if (isMobile) {
    return (
      <div className="px-4 py-4 space-y-6">
        {/* Device Info */}
        <div className="rounded-xl bg-background overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-base">Name</span>
            <div className="flex items-center gap-1">
              <span className="text-base text-muted-foreground">alana's iphone</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-base">iOS Version</span>
            <div className="flex items-center gap-1">
              <span className="text-base text-muted-foreground">18.2</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-base">Model Name</span>
            <span className="text-base text-muted-foreground">iPhone 16 Pro</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-base">Model Number</span>
            <span className="text-base text-muted-foreground">MYMG3LL/A</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-base">Serial Number</span>
            <span className="text-base text-muted-foreground">F482917XKL</span>
          </div>
        </div>

        {/* AppleCare+ */}
        <div>
          <div className="rounded-xl bg-background overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <span className="text-base">AppleCare+</span>
              <div className="flex items-center gap-1">
                <span className="text-base text-muted-foreground">Expires 1/4/27</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <div className="px-4 py-3">
              <span className="text-base text-blue-500">Upgrade Coverage</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground px-2 pt-2">
            There are {daysLeft} days left to add coverage for accidental damage.
          </p>
        </div>

        {/* Storage Stats */}
        <div className="rounded-xl bg-background overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-base">Songs</span>
            <span className="text-base text-muted-foreground">0</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-base">Videos</span>
            <span className="text-base text-muted-foreground">3,210</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-base">Photos</span>
            <span className="text-base text-muted-foreground">52,042</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-base">Applications</span>
            <span className="text-base text-muted-foreground">81</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-base">Capacity</span>
            <span className="text-base text-muted-foreground">256 GB</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
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
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailPath}
                  alt={`macOS ${currentOS.name}`}
                  className="w-full h-full object-cover"
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
