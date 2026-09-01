"use client";

import { useState } from "react";
import Image from "next/image";
import { Settings, Paintbrush, Search, X, Wifi, Bluetooth, Moon, PanelBottom, PanelTop, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsCategory, SettingsPanel } from "./settings-app";
import { SidebarNav } from "./sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  selectedCategory: SettingsCategory;
  selectedPanel: SettingsPanel;
  onCategorySelect: (category: SettingsCategory) => void;
  onAccountClick: () => void;
  isDesktop?: boolean;
}

const categories: { id: SettingsCategory; name: string; icon: React.ReactNode; iconBg: string; keywords: string[] }[] = [
  {
    id: "wifi",
    name: "Wi-Fi",
    icon: <Wifi className="w-5 h-5 text-white" />,
    iconBg: "bg-blue-500",
    keywords: ["wifi", "wireless", "network", "internet", "connect"],
  },
  {
    id: "bluetooth",
    name: "Bluetooth",
    icon: <Bluetooth className="w-5 h-5 text-white" />,
    iconBg: "bg-blue-500",
    keywords: ["bluetooth", "wireless", "devices", "airpods", "keyboard", "trackpad"],
  },
  {
    id: "general",
    name: "General",
    icon: <Settings className="w-5 h-5 text-white" />,
    iconBg: "bg-gray-500",
    keywords: ["about", "macbook", "software update", "storage", "chip", "memory", "serial", "macos", "sonoma"],
  },
  {
    id: "appearance",
    name: "Appearance",
    icon: <Paintbrush className="w-5 h-5 text-white" />,
    iconBg: "bg-blue-500",
    keywords: ["light", "dark", "auto", "theme", "mode"],
  },
  {
    id: "wallpaper",
    name: "Wallpaper",
    icon: <ImageIcon className="w-5 h-5 text-white" />,
    iconBg: "bg-gradient-to-b from-cyan-400 to-blue-500",
    keywords: ["wallpaper", "background", "desktop", "photo", "photos", "theme"],
  },
  {
    id: "desktop-dock",
    name: "Desktop & Dock",
    icon: <PanelBottom className="w-5 h-5 text-white" />,
    iconBg: "bg-gray-500",
    keywords: ["desktop", "dock", "open", "applications", "indicators", "dots"],
  },
  {
    id: "menu-bar",
    name: "Menu Bar",
    icon: <PanelTop className="w-5 h-5 text-white" />,
    iconBg: "bg-gray-500",
    keywords: ["menu bar", "clock", "time", "date", "seconds"],
  },
  {
    id: "focus",
    name: "Focus",
    icon: <Moon className="w-5 h-5 fill-current text-white" />,
    iconBg: "bg-gradient-to-b from-violet-400 to-indigo-600",
    keywords: ["focus", "do not disturb", "sleep", "reduce interruptions", "notifications"],
  },
];

const appleAccountKeywords = ["alana", "goyal", "apple", "account", "personal", "information", "name", "birthday"];

export function Sidebar({
  selectedCategory,
  selectedPanel,
  onCategorySelect,
  onAccountClick,
  isDesktop = false,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  const query = searchQuery.toLowerCase();

  // Filter categories based on search (name or keywords)
  const filteredCategories = categories.filter((category) => {
    return category.name.toLowerCase().includes(query) ||
      category.keywords.some((keyword) => keyword.includes(query));
  });

  // Check if Apple Account matches search
  const showAppleAccount =
    searchQuery === "" ||
    appleAccountKeywords.some((keyword) => keyword.includes(query));

  return (
    <div className="flex flex-col h-full select-none w-[320px] bg-muted border-r border-border/50">
      {/* Nav with window controls */}
      <SidebarNav isScrolled={isScrolled} isDesktop={isDesktop} />

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea
          className="h-full"
          onScrollCapture={(e: React.UIEvent<HTMLDivElement>) => {
            const viewport = e.currentTarget.querySelector(
              "[data-radix-scroll-area-viewport]"
            );
            if (viewport) {
              setIsScrolled(viewport.scrollTop > 0);
            }
          }}
          isMobile={false}
        >
          <div className="flex flex-col w-full">
            <div className="w-[320px] px-2">
              {/* Search bar */}
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full rounded-lg bg-[#E8E8E7] py-0.5 pl-8 pr-8 text-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none dark:bg-[#353533]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Apple Account */}
              {showAppleAccount && (
                <div className="py-2">
                  <button
                    onClick={onAccountClick}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                      selectedPanel === "personal-info"
                        ? "bg-zinc-300 dark:bg-zinc-600"
                        : "can-hover:hover:bg-background/50"
                    )}
                  >
                    <Image
                      src="/headshot.jpg"
                      alt="Alana Goyal"
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="text-left">
                      <div className="font-medium text-xs">Alana Goyal</div>
                      <div className="text-[10px] text-muted-foreground">Apple Account</div>
                    </div>
                  </button>
                </div>
              )}

              {/* Categories */}
              <div className="py-2">
                <div className="space-y-0.5">
                  {filteredCategories.map((category) => {
                    const isSelected = selectedCategory === category.id && selectedPanel !== "personal-info";
                    return (
                      <button
                        key={category.id}
                        onClick={() => onCategorySelect(category.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors",
                          isSelected
                            ? "bg-zinc-300 dark:bg-zinc-600 text-foreground"
                            : "can-hover:hover:bg-background/50 text-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-md",
                            category.iconBg
                          )}
                        >
                          {category.icon}
                        </span>
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
