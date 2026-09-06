import type { SettingsCategory, SettingsPanel } from "./settings-app";

export interface SettingsSearchItem {
  id: string;
  label: string;
  category: SettingsCategory;
  panel: SettingsPanel;
  keywords: string[];
}

export const SETTINGS_SEARCH_ITEMS: SettingsSearchItem[] = [
  { id: "wifi", label: "Wi-Fi", category: "wifi", panel: null, keywords: ["wireless", "network", "internet", "connect"] },
  { id: "bluetooth", label: "Bluetooth", category: "bluetooth", panel: null, keywords: ["wireless", "devices", "airpods", "keyboard", "trackpad"] },
  { id: "general", label: "General", category: "general", panel: null, keywords: ["settings", "preferences"] },
  { id: "appearance", label: "Appearance", category: "appearance", panel: null, keywords: ["light", "dark", "auto", "theme", "mode"] },
  { id: "macos-version", label: "macOS Version", category: "appearance", panel: null, keywords: ["software update", "operating system", "sierra", "sonoma"] },
  { id: "wallpaper", label: "Wallpaper", category: "wallpaper", panel: null, keywords: ["background", "desktop", "photo", "theme"] },
  { id: "desktop-dock", label: "Desktop & Dock", category: "desktop-dock", panel: null, keywords: ["applications", "desktop", "dock"] },
  { id: "dock-indicators", label: "Show indicators for open applications", category: "desktop-dock", panel: null, keywords: ["dock", "running apps", "dots"] },
  { id: "menu-bar-background", label: "Show menu bar background", category: "menu-bar", panel: null, keywords: ["contrast", "transparent", "menu bar"] },
  { id: "clock", label: "Clock Options", category: "menu-bar", panel: null, keywords: ["time", "date", "weekday", "seconds", "digital", "analog"] },
  { id: "focus-modes", label: "Focus Modes", category: "focus", panel: null, keywords: ["do not disturb", "sleep", "reduce interruptions", "notifications"] },
  { id: "about", label: "About This Mac", category: "general", panel: "about", keywords: ["macbook", "chip", "memory", "serial"] },
  { id: "storage", label: "Storage", category: "general", panel: "storage", keywords: ["disk", "space", "capacity"] },
  { id: "personal-info", label: "Personal Information", category: "general", panel: "personal-info", keywords: ["apple account", "name", "birthday"] },
];

export function searchSettings(query: string): SettingsSearchItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  return SETTINGS_SEARCH_ITEMS.filter((item) =>
    [item.label, ...item.keywords]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
}

export function getNextSettingsSearchResultIndex(
  currentIndex: number,
  resultCount: number,
  direction: 1 | -1,
): number {
  if (resultCount <= 0) return 0;
  return (currentIndex + direction + resultCount) % resultCount;
}
