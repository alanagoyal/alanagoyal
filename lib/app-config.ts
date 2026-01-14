import { AppConfig } from "@/types/apps";

export const APPS: AppConfig[] = [
  {
    id: "finder",
    name: "Finder",
    icon: "/finder.svg",
    description: "File browser",
    accentColor: "#007AFF",
    defaultPosition: { x: 80, y: 40 },
    defaultSize: { width: 900, height: 600 },
    minSize: { width: 600, height: 400 },
    menuBarTitle: "Finder",
  },
  {
    id: "notes",
    name: "Notes",
    icon: "/notes.svg",
    description: "Personal notes and thoughts",
    accentColor: "#FFCC00",
    defaultPosition: { x: 100, y: 50 },
    defaultSize: { width: 900, height: 600 },
    minSize: { width: 600, height: 400 },
    menuBarTitle: "Notes",
  },
  {
    id: "messages",
    name: "Messages",
    icon: "/messages.svg",
    description: "Chat with AI personas",
    accentColor: "#34C759",
    defaultPosition: { x: 150, y: 80 },
    defaultSize: { width: 800, height: 550 },
    minSize: { width: 500, height: 400 },
    menuBarTitle: "Messages",
  },
  {
    id: "photos",
    name: "Photos",
    icon: "/photos.svg",
    description: "Photo library",
    accentColor: "#FF6B6B",
    defaultPosition: { x: 130, y: 60 },
    defaultSize: { width: 900, height: 650 },
    minSize: { width: 600, height: 450 },
    menuBarTitle: "Photos",
  },
  {
    id: "iterm",
    name: "iTerm",
    icon: "/iterm.svg",
    description: "Terminal emulator",
    accentColor: "#00D455",
    defaultPosition: { x: 120, y: 70 },
    defaultSize: { width: 800, height: 500 },
    minSize: { width: 500, height: 300 },
    menuBarTitle: "iTerm",
  },
  {
    id: "settings",
    name: "Settings",
    icon: "/settings.svg",
    description: "System preferences",
    accentColor: "#8E8E93",
    defaultPosition: { x: 200, y: 100 },
    defaultSize: { width: 900, height: 600 },
    minSize: { width: 700, height: 400 },
    menuBarTitle: "System Settings",
  },
];

export function getAppById(id: string): AppConfig | undefined {
  return APPS.find((app) => app.id === id);
}

export function getAppIds(): string[] {
  return APPS.map((app) => app.id);
}
