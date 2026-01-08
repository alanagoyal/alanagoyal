"use client";

import { useState } from "react";
import Image from "next/image";
import { Settings, Paintbrush, Search, X, ChevronRight, Plane, Wifi, Bluetooth, Radio, Link2, Battery } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsCategory } from "./settings-app";
import { SidebarNav } from "./sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  selectedCategory: SettingsCategory;
  selectedPanel: "about" | "personal-info" | null;
  onCategorySelect: (category: SettingsCategory) => void;
  onAccountClick: () => void;
  isMobile: boolean;
  isDesktop?: boolean;
}

const categories: { id: SettingsCategory; name: string; icon: React.ReactNode; iconBg: string; keywords: string[] }[] = [
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
];

const connectivityItems = [
  { id: "airplane", name: "Airplane Mode", icon: <Plane className="w-5 h-5 text-white" />, iconBg: "bg-orange-500", type: "toggle" as const, value: false },
  { id: "wifi", name: "Wi-Fi", icon: <Wifi className="w-5 h-5 text-white" />, iconBg: "bg-blue-500", type: "value" as const, value: "basecase" },
  { id: "bluetooth", name: "Bluetooth", icon: <Bluetooth className="w-5 h-5 text-white" />, iconBg: "bg-blue-500", type: "nav" as const, value: "On" },
  { id: "cellular", name: "Cellular", icon: <Radio className="w-5 h-5 text-white" />, iconBg: "bg-green-500", type: "static" as const },
  { id: "hotspot", name: "Personal Hotspot", icon: <Link2 className="w-5 h-5 text-white" />, iconBg: "bg-green-500", type: "value" as const, value: "Off" },
  { id: "battery", name: "Battery", icon: <Battery className="w-5 h-5 text-white" />, iconBg: "bg-green-500", type: "static" as const },
];

const appleAccountKeywords = ["alana", "goyal", "apple", "account", "personal", "information", "name", "birthday"];

export function Sidebar({
  selectedCategory,
  selectedPanel,
  onCategorySelect,
  onAccountClick,
  isMobile,
  isDesktop = false,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [airplaneMode, setAirplaneMode] = useState(false);

  const query = searchQuery.toLowerCase();

  // Filter categories based on search (name or keywords)
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(query) ||
    category.keywords.some((keyword) => keyword.includes(query))
  );

  // Check if Apple Account matches search
  const showAppleAccount =
    searchQuery === "" ||
    appleAccountKeywords.some((keyword) => keyword.includes(query));

  // Mobile layout - iOS style
  if (isMobile) {
    return (
      <div className="flex flex-col h-full select-none w-full bg-muted/30">
        {/* Nav with window controls */}
        <SidebarNav isMobile={isMobile} isScrolled={isScrolled} isDesktop={isDesktop} />

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea
            className="h-full"
            viewportClassName="bg-muted/30"
            onScrollCapture={(e: React.UIEvent<HTMLDivElement>) => {
              const viewport = e.currentTarget.querySelector(
                "[data-radix-scroll-area-viewport]"
              );
              if (viewport) {
                setIsScrolled(viewport.scrollTop > 0);
              }
            }}
            isMobile={isMobile}
            bottomMargin="0px"
          >
            <div className="px-4 pt-2 pb-8 min-h-full">
              {/* Search bar */}
              <div className="px-0 pb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-8 pr-8 py-0.5 rounded-lg text-base sm:text-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none bg-[#E8E8E7] dark:bg-[#353533]"
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

              <div>
                {/* Apple Account card */}
                {showAppleAccount && (
                  <button
                    onClick={onAccountClick}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-background mb-4"
                  >
                    <Image
                      src="/headshot.jpg"
                      alt="Alana Goyal"
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                    <div className="text-left flex-1">
                      <div className="font-semibold text-lg">Alana Goyal</div>
                      <div className="text-sm text-muted-foreground">
                        Apple Account, iCloud+, and more
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}

                {/* Connectivity section */}
                <div className="rounded-xl bg-background overflow-hidden mb-4">
                  {connectivityItems.map((item, index) => {
                    const isNav = item.type === "nav";
                    const Wrapper = isNav ? "button" : "div";
                    return (
                      <Wrapper
                        key={item.id}
                        onClick={isNav ? () => onCategorySelect("bluetooth") : undefined}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3",
                          index < connectivityItems.length - 1 && "border-b border-border/50",
                          isNav && "hover:bg-muted/50"
                        )}
                      >
                        <span
                          className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg",
                            item.iconBg
                          )}
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left text-base">{item.name}</span>
                        {item.type === "toggle" && (
                          <button
                            onClick={() => setAirplaneMode(!airplaneMode)}
                            className={cn(
                              "w-12 h-7 rounded-full relative transition-colors",
                              airplaneMode ? "bg-green-500" : "bg-gray-300"
                            )}
                          >
                            <div className={cn(
                              "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform",
                              airplaneMode ? "translate-x-5" : "translate-x-0.5"
                            )} />
                          </button>
                        )}
                        {item.type === "value" && (
                          <span className="text-muted-foreground text-base">{item.value}</span>
                        )}
                        {item.type === "nav" && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground text-base">{item.value}</span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </Wrapper>
                    );
                  })}
                </div>

                {/* Categories in grouped container */}
                <div className="rounded-xl bg-background overflow-hidden">
                  {filteredCategories.map((category, index) => (
                    <button
                      key={category.id}
                      onClick={() => onCategorySelect(category.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 text-base transition-colors hover:bg-muted/50",
                        index < filteredCategories.length - 1 && "border-b border-border/50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg",
                          category.iconBg
                        )}
                      >
                        {category.icon}
                      </span>
                      <span className="flex-1 text-left">{category.name}</span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex flex-col h-full select-none w-[320px] bg-muted border-r border-border/50">
      {/* Nav with window controls */}
      <SidebarNav isMobile={isMobile} isScrolled={isScrolled} isDesktop={isDesktop} />

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
          isMobile={isMobile}
          bottomMargin="0px"
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
                    className="w-full pl-8 pr-8 py-0.5 rounded-lg text-base sm:text-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none bg-[#E8E8E7] dark:bg-[#353533]"
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
                        ? "bg-blue-500 text-white"
                        : "hover:bg-background/50"
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
                      <div className="font-medium text-sm">Alana Goyal</div>
                      <div className={cn(
                        "text-xs",
                        selectedPanel === "personal-info" ? "text-white/70" : "text-muted-foreground"
                      )}>Apple Account</div>
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
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "hover:bg-background/50 text-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-md",
                            isSelected ? "bg-white/20" : category.iconBg
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
