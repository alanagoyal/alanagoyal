import type { AppConfig } from "@/types/apps";
import type { Position, Size } from "@/types/window";

export const APPS: AppConfig[] = [
  {
    id: "finder",
    name: "Finder",
    icon: "/finder.png",
    description: "File browser",
    provenance: { agent: "Claude Code", circa: "January 2026" },
    accentColor: "#007AFF",
    defaultPosition: { x: 80, y: 40 },
    defaultSize: { width: 900, height: 600 },
    minSize: { width: 600, height: 400 },
    menuBarTitle: "Finder",
    dockOrder: 0,
    mobile: {
      supported: false,
      shellFallbackAppId: "notes",
      directRouteRedirectTo: "/notes",
      showInFinderApplications: false,
    },
    multiWindow: true,
    cascadeOffset: 30,
  },
  {
    id: "notes",
    name: "Notes",
    icon: "/notes.png",
    description: "Personal notes and thoughts",
    provenance: { agent: "Cursor", circa: "March 2024" },
    accentColor: "#FFCC00",
    defaultPosition: { x: 100, y: 50 },
    defaultSize: { width: 900, height: 600 },
    minSize: { width: 600, height: 400 },
    menuBarTitle: "Notes",
    mobile: { supported: true },
  },
  {
    id: "messages",
    name: "Messages",
    icon: "/messages.png",
    description: "Chat with AI personas",
    provenance: { agent: "Windsurf", circa: "November 2024" },
    accentColor: "#34C759",
    defaultPosition: { x: 150, y: 80 },
    defaultSize: { width: 800, height: 550 },
    minSize: { width: 500, height: 400 },
    menuBarTitle: "Messages",
    mobile: { supported: true },
  },
  {
    id: "photos",
    name: "Photos",
    icon: "/photos.png",
    description: "Photo library",
    provenance: { agent: "Claude Code", circa: "January 2026" },
    accentColor: "#FF6B6B",
    defaultPosition: { x: 130, y: 60 },
    defaultSize: { width: 960, height: 650 },
    minSize: { width: 960, height: 450 },
    menuBarTitle: "Photos",
    mobile: { supported: true },
  },
  {
    id: "music",
    name: "Music",
    icon: "/music.png",
    description: "Music library",
    provenance: { agent: "Claude Code", circa: "January 2026" },
    accentColor: "#FA2D48",
    defaultPosition: { x: 140, y: 70 },
    defaultSize: { width: 900, height: 650 },
    minSize: { width: 600, height: 450 },
    menuBarTitle: "Music",
    mobile: { supported: true },
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: "/calendar.png",
    description: "Calendar and events",
    provenance: { agent: "Claude Code", circa: "January 2026" },
    accentColor: "#FF3B30",
    defaultPosition: { x: 170, y: 60 },
    defaultSize: { width: 900, height: 700 },
    minSize: { width: 700, height: 500 },
    menuBarTitle: "Calendar",
    mobile: { supported: true },
  },
  {
    id: "weather",
    name: "Weather",
    icon: "/weather.png",
    description: "Weather forecast",
    provenance: { agent: "Codex", circa: "March 2026" },
    accentColor: "#0A7CFF",
    defaultPosition: { x: 220, y: 90 },
    defaultSize: { width: 780, height: 560 },
    minSize: { width: 560, height: 420 },
    menuBarTitle: "Weather",
    showOnDockByDefault: false,
    mobile: {
      supported: false,
      shellFallbackAppId: "notes",
      directRouteRedirectTo: "/notes",
      showInFinderApplications: false,
    },
  },
  {
    id: "iterm",
    name: "iTerm",
    icon: "/iterm.png",
    description: "Terminal emulator",
    provenance: { agent: "Claude Code", circa: "January 2026" },
    accentColor: "#00D455",
    defaultPosition: { x: 120, y: 70 },
    defaultSize: { width: 800, height: 500 },
    minSize: { width: 500, height: 300 },
    menuBarTitle: "iTerm",
    mobile: {
      supported: false,
      shellFallbackAppId: "notes",
      directRouteRedirectTo: "/notes",
      showInFinderApplications: false,
    },
  },
  {
    id: "games",
    name: "Games",
    icon: "/games.png",
    description: "Chess and classic games",
    provenance: { agent: "Codex", circa: "August 2026" },
    accentColor: "#5856D6",
    defaultPosition: { x: 260, y: 90 },
    defaultSize: { width: 980, height: 650 },
    minSize: { width: 560, height: 560 },
    menuBarTitle: "Games",
    dockOrder: 1,
    dockIconScale: 0.94,
    mobile: {
      supported: false,
      shellFallbackAppId: "notes",
      directRouteRedirectTo: "/notes",
      showInFinderApplications: false,
    },
  },
  {
    id: "settings",
    name: "Settings",
    icon: "/settings.png",
    description: "System preferences",
    provenance: { agent: "Claude Code", circa: "January 2026" },
    accentColor: "#8E8E93",
    defaultPosition: { x: 200, y: 100 },
    defaultSize: { width: 900, height: 600 },
    minSize: { width: 700, height: 400 },
    menuBarTitle: "System Settings",
    mobile: {
      supported: false,
      shellFallbackAppId: "notes",
      directRouteRedirectTo: "/notes",
      showInFinderApplications: false,
    },
  },
  {
    id: "textedit",
    name: "TextEdit",
    icon: "/textedit.png",
    description: "Plain text editor",
    provenance: { agent: "Claude Code", circa: "January 2026" },
    accentColor: "#8E8E93",
    defaultPosition: { x: 160, y: 90 },
    defaultSize: { width: 700, height: 500 },
    minSize: { width: 400, height: 300 },
    menuBarTitle: "TextEdit",
    showOnDockByDefault: false,
    mobile: {
      supported: false,
      shellFallbackAppId: "notes",
      directRouteRedirectTo: "/notes",
      showInFinderApplications: false,
    },
    multiWindow: true,
    cascadeOffset: 30,
  },
  {
    id: "preview",
    name: "Preview",
    icon: "/preview.png",
    description: "Image and PDF viewer",
    provenance: { agent: "Claude Code", circa: "February 2026" },
    accentColor: "#007AFF",
    defaultPosition: { x: 180, y: 100 },
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 400, height: 300 },
    menuBarTitle: "Preview",
    showOnDockByDefault: false,
    mobile: {
      supported: false,
      shellFallbackAppId: "notes",
      directRouteRedirectTo: "/notes",
      showInFinderApplications: false,
    },
    multiWindow: true,
    cascadeOffset: 30,
  },
];

export function getAppById(id: string): AppConfig | undefined {
  return APPS.find((app) => app.id === id);
}

export function clampAppWindowSize(appId: string, size: Size): Size {
  const minSize = getAppById(appId)?.minSize;
  if (!minSize) return size;

  return {
    width: Math.max(size.width, minSize.width),
    height: Math.max(size.height, minSize.height),
  };
}

export function migrateAppWindowFrame(
  appId: string,
  position: Position,
  size: Size,
  viewportWidth?: number,
): { position: Position; size: Size } {
  const nextSize = clampAppWindowSize(appId, size);
  const didWidthResize = nextSize.width !== size.width;

  if (!didWidthResize || viewportWidth === undefined) {
    return { position, size: nextSize };
  }

  return {
    position: {
      ...position,
      x: Math.min(position.x, Math.max(0, viewportWidth - nextSize.width)),
    },
    size: nextSize,
  };
}

export function getAppIds(): string[] {
  return APPS.map((app) => app.id);
}

export function getAppsInDockOrder(): AppConfig[] {
  return APPS
    .map((app, registryIndex) => ({ app, registryIndex }))
    .sort((left, right) => {
      const leftOrder = left.app.dockOrder;
      const rightOrder = right.app.dockOrder;
      if (leftOrder !== undefined && rightOrder !== undefined) return leftOrder - rightOrder;
      if (leftOrder !== undefined) return -1;
      if (rightOrder !== undefined) return 1;
      return left.registryIndex - right.registryIndex;
    })
    .map(({ app }) => app);
}
