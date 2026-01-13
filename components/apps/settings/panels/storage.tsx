"use client";

import { cn } from "@/lib/utils";

interface StoragePanelProps {
  isMobile?: boolean;
}

// Storage categories with colors matching macOS
const storageCategories = [
  { id: "documents", label: "Documents", color: "bg-red-500", size: 45.2 },
  { id: "apps", label: "Apps", color: "bg-purple-500", size: 28.7 },
  { id: "system", label: "macOS", color: "bg-zinc-500", size: 15.8 },
  { id: "other", label: "Other", color: "bg-zinc-400", size: 124.0 },
];

const totalSize = 994.66; // GB
const usedSize = 613.71; // GB
const availableSize = totalSize - usedSize;

export function StoragePanel({ isMobile = false }: StoragePanelProps) {
  // Calculate width percentages for the bar
  const usedPercent = (usedSize / totalSize) * 100;

  return (
    <div className={cn("py-6", isMobile ? "px-4" : "px-6 max-w-2xl mx-auto")}>
      {/* Macintosh HD Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={cn("font-medium", isMobile ? "text-base" : "text-sm")}>
            Macintosh HD
          </span>
          <span className={cn("text-muted-foreground", isMobile ? "text-base" : "text-sm")}>
            {usedSize.toFixed(2)} GB of {totalSize.toFixed(2)} GB used
          </span>
        </div>

        {/* Storage Bar */}
        <div className="relative h-5 rounded-md overflow-hidden bg-zinc-700">
          {/* Used space segments */}
          <div
            className="absolute inset-y-0 left-0 flex"
            style={{ width: `${usedPercent}%` }}
          >
            {storageCategories.map((category, index) => {
              const categoryPercent = (category.size / usedSize) * 100;
              return (
                <div
                  key={category.id}
                  className={cn(category.color, index === 0 && "rounded-l-md")}
                  style={{ width: `${categoryPercent}%` }}
                />
              );
            })}
          </div>

          {/* Available space label */}
          <div className="absolute inset-y-0 right-2 flex items-center">
            <span className="text-xs text-zinc-300">
              {availableSize.toFixed(2)} GB
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {storageCategories.map((category) => (
          <div key={category.id} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", category.color)} />
            <span className={cn("text-muted-foreground", isMobile ? "text-sm" : "text-xs")}>
              {category.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
