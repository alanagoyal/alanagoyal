"use client";

import { Info, Download, HardDrive, ChevronRight } from "lucide-react";
import { SettingsPanel } from "../settings-app";
import { cn } from "@/lib/utils";

interface GeneralPanelProps {
  onPanelSelect: (panel: SettingsPanel) => void;
  isMobile?: boolean;
}

const items = [
  {
    id: "about" as const,
    name: "About",
    icon: <Info className="w-5 h-5 text-white" />,
    iconBg: "bg-blue-500",
    navigable: true,
  },
  {
    id: "software-update" as const,
    name: "Software Update",
    icon: <Download className="w-5 h-5 text-white" />,
    iconBg: "bg-gray-500",
    navigable: false,
  },
  {
    id: "storage" as const,
    name: "Storage",
    icon: <HardDrive className="w-5 h-5 text-white" />,
    iconBg: "bg-gray-500",
    navigable: false,
  },
];

export function GeneralPanel({ onPanelSelect, isMobile = false }: GeneralPanelProps) {
  return (
    <div className={isMobile ? "" : "space-y-1"}>
      <div className={cn("rounded-xl overflow-hidden", isMobile ? "bg-background" : "bg-muted/50")}>
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
              <span className={cn(
                "flex items-center justify-center w-7 h-7 rounded-md",
                isMobile ? item.iconBg : "bg-muted-foreground/10"
              )}>
                {isMobile ? item.icon : (
                  item.id === "about" ? <Info className="w-5 h-5" /> :
                  item.id === "software-update" ? <Download className="w-5 h-5" /> :
                  <HardDrive className="w-5 h-5" />
                )}
              </span>
              <span className={isMobile ? "text-base" : "text-xs"}>{item.name}</span>
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
