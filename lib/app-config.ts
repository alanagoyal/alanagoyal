import { AppConfig } from "@/types/apps";

export const APPS: AppConfig[] = [
  {
    id: "notes",
    name: "Notes",
    icon: "/notes.png",
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
    icon: "/messages.png",
    description: "Chat with AI personas",
    accentColor: "#34C759",
    defaultPosition: { x: 150, y: 80 },
    defaultSize: { width: 800, height: 550 },
    minSize: { width: 500, height: 400 },
    menuBarTitle: "Messages",
  },
  {
    id: "settings",
    name: "Settings",
    icon: "/settings.png",
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
