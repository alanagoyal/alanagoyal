"use client";

import { Info, Download, HardDrive, ChevronRight } from "lucide-react";
import { SettingsPanel } from "../settings-app";
import { cn } from "@/lib/utils";

interface GeneralPanelProps {
  onPanelSelect: (panel: SettingsPanel) => void;
}

const items = [
  {
    id: "about" as const,
    name: "About",
    icon: <Info className="w-5 h-5" />,
    navigable: true,
  },
  {
    id: "software-update" as const,
    name: "Software Update",
    icon: <Download className="w-5 h-5" />,
    navigable: false,
  },
  {
    id: "storage" as const,
    name: "Storage",
    icon: <HardDrive className="w-5 h-5" />,
    navigable: false,
  },
];

export function GeneralPanel({ onPanelSelect }: GeneralPanelProps) {
  return (
    <div className="space-y-1">
      <div className="rounded-xl bg-muted/50 overflow-hidden">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => item.navigable && onPanelSelect(item.id === "about" ? "about" : null)}
            disabled={!item.navigable}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 transition-colors",
              item.navigable ? "hover:bg-muted cursor-pointer" : "cursor-default",
              index !== items.length - 1 && "border-b border-border/50"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-muted-foreground/10">
                {item.icon}
              </span>
              <span className="text-sm">{item.name}</span>
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
