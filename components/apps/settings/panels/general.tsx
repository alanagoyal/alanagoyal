"use client";

import { Info, Download, HardDrive, ChevronRight } from "lucide-react";
import { SettingsPanel, SettingsCategory } from "../settings-app";
import { cn } from "@/lib/utils";

interface GeneralPanelProps {
  onPanelSelect: (panel: SettingsPanel) => void;
  onCategorySelect?: (category: SettingsCategory, options?: { scrollToOSVersion?: boolean }) => void;
}

const items = [
  {
    id: "about" as const,
    name: "About",
    navigable: true,
  },
  {
    id: "software-update" as const,
    name: "Software Update",
    navigable: true,
  },
  {
    id: "storage" as const,
    name: "Storage",
    navigable: true,
  },
];

export function GeneralPanel({ onPanelSelect, onCategorySelect }: GeneralPanelProps) {
  const handleItemClick = (itemId: string) => {
    if (itemId === "about") {
      onPanelSelect("about");
    } else if (itemId === "software-update") {
      // Navigate to Appearance category and scroll to OS version
      onCategorySelect?.("appearance", { scrollToOSVersion: true });
    } else if (itemId === "storage") {
      onPanelSelect("storage");
    }
  };

  return (
    <div className="space-y-1">
      <div className="overflow-hidden rounded-xl bg-muted/50">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => item.navigable && handleItemClick(item.id)}
            disabled={!item.navigable}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 transition-colors",
              item.navigable ? "can-hover:hover:bg-muted cursor-pointer" : "cursor-default",
              index !== items.length - 1 && "border-b border-border/50"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted-foreground/10">
                {item.id === "about" ? <Info className="w-5 h-5" /> :
                item.id === "software-update" ? <Download className="w-5 h-5" /> :
                <HardDrive className="w-5 h-5" />}
              </span>
              <span className="text-xs">{item.name}</span>
            </div>
            {item.navigable && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
