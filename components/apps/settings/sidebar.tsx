"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Settings, Paintbrush, Search, X, Wifi, Bluetooth, Moon, PanelBottom, PanelTop, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsCategory, SettingsPanel } from "./settings-app";
import { SidebarNav } from "./sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNextSettingsSearchResultIndex,
  searchSettings,
  type SettingsSearchItem,
} from "./search-items";
import { useWindowFocus } from "@/lib/window-focus-context";

interface SidebarProps {
  selectedCategory: SettingsCategory;
  selectedPanel: SettingsPanel;
  onCategorySelect: (category: SettingsCategory) => void;
  onAccountClick: () => void;
  isDesktop?: boolean;
  onSearchResultSelect: (item: SettingsSearchItem) => void;
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
  onSearchResultSelect,
}: SidebarProps) {
  const windowFocus = useWindowFocus();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedSearchIndex, setHighlightedSearchIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const query = searchQuery.toLowerCase();
  const searchResults = searchSettings(searchQuery);

  // Filter categories based on search (name or keywords)
  const filteredCategories = categories.filter((category) => {
    return category.name.toLowerCase().includes(query) ||
      category.keywords.some((keyword) => keyword.includes(query));
  });

  // Check if Apple Account matches search
  const showAppleAccount =
    searchQuery === "" ||
    appleAccountKeywords.some((keyword) => keyword.includes(query));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (windowFocus && !windowFocus.isFocused) return;

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const isSearchFocused = document.activeElement === searchInputRef.current;

      if (event.key === "Escape" && (isSearchFocused || searchQuery)) {
        event.preventDefault();
        if (isSearchFocused) {
          searchInputRef.current?.blur();
        } else {
          setSearchQuery("");
          setHighlightedSearchIndex(0);
        }
        return;
      }

      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!searchQuery || searchResults.length === 0) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction: 1 | -1 = event.key === "ArrowDown" ? 1 : -1;
        setHighlightedSearchIndex((index) =>
          getNextSettingsSearchResultIndex(index, searchResults.length, direction),
        );
        return;
      }

      if (event.key === "Enter") {
        const item = searchResults[highlightedSearchIndex];
        if (!item) return;
        event.preventDefault();
        onSearchResultSelect(item);
        setSearchQuery("");
        setHighlightedSearchIndex(0);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [highlightedSearchIndex, onSearchResultSelect, searchQuery, searchResults, windowFocus]);

  useEffect(() => {
    setHighlightedSearchIndex((index) =>
      Math.min(index, Math.max(0, searchResults.length - 1)),
    );
  }, [searchResults.length]);

  useEffect(() => {
    if (!searchQuery || searchResults.length === 0) return;
    searchResultsRef.current
      ?.querySelector(`[data-settings-search-result-index="${highlightedSearchIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlightedSearchIndex, searchQuery, searchResults.length]);

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
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedSearchIndex(0);
                    }}
                    placeholder="Search"
                    aria-label="Search settings"
                    className="w-full rounded-lg bg-[#E8E8E7] py-0.5 pl-8 pr-8 text-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none dark:bg-[#353533]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSearchQuery("");
                        setHighlightedSearchIndex(0);
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground can-hover:hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {searchQuery ? (
                <div ref={searchResultsRef} className="space-y-0.5 py-2">
                  {searchResults.length > 0 ? searchResults.map((item, index) => {
                    const isHighlighted = index === highlightedSearchIndex;
                    return (
                    <button
                      key={item.id}
                      type="button"
                      data-settings-search-result-index={index}
                      aria-current={isHighlighted ? "true" : undefined}
                      onClick={() => {
                        onSearchResultSelect(item);
                        setSearchQuery("");
                        setHighlightedSearchIndex(0);
                        searchInputRef.current?.blur();
                      }}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left active:bg-background/70",
                        isHighlighted
                          ? "bg-[#0A7CFF] text-white"
                          : "can-hover:hover:bg-background/50",
                      )}
                    >
                      <span className="block text-xs font-medium">{item.label}</span>
                      <span className={cn(
                        "block text-[10px] capitalize",
                        isHighlighted ? "text-white/80" : "text-muted-foreground",
                      )}>
                        {item.category.replace("-", " & ")}
                      </span>
                    </button>
                    );
                  }) : (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">No settings found</p>
                  )}
                </div>
              ) : (<>
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
              </>)}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
