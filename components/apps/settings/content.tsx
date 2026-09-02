"use client";

import { Settings, Paintbrush, Bluetooth, Wifi, Moon, PanelBottom, PanelTop, ImageIcon } from "lucide-react";
import { SettingsCategory, SettingsPanel } from "./settings-app";
import { GeneralPanel } from "./panels/general";
import { AboutPanel } from "./panels/about";
import { AppearancePanel } from "./panels/appearance";
import { PersonalInfoPanel } from "./panels/personal-info";
import { BluetoothPanel } from "./panels/bluetooth";
import { WifiPanel } from "./panels/wifi";
import { StoragePanel } from "./panels/storage";
import { FocusPanel } from "./panels/focus";
import { MenuBarPanel } from "./panels/menu-bar";
import { WallpaperPanel } from "./panels/wallpaper";
import { DesktopDockPanel } from "./panels/desktop-dock";

interface ContentProps {
  selectedCategory: SettingsCategory;
  selectedPanel: SettingsPanel;
  onPanelSelect: (panel: SettingsPanel) => void;
  onCategorySelect: (category: SettingsCategory, options?: { scrollToOSVersion?: boolean }) => void;
  scrollToOSVersion?: boolean;
  onScrollComplete?: () => void;
}

const categoryInfo: Record<
  SettingsCategory,
  { icon: React.ReactNode; title: string; description: string }
> = {
  general: {
    icon: <Settings className="w-8 h-8" />,
    title: "General",
    description: "Manage your overall setup and preferences for Mac, such as software updates, device language, AirDrop, and more.",
  },
  appearance: {
    icon: <Paintbrush className="w-8 h-8" />,
    title: "Appearance",
    description: "Customize the look and feel of your Mac.",
  },
  wallpaper: {
    icon: <ImageIcon className="w-8 h-8" />,
    title: "Wallpaper",
    description: "Choose a theme wallpaper or use a photo from your library.",
  },
  wifi: {
    icon: <Wifi className="w-8 h-8" />,
    title: "Wi-Fi",
    description: "Set up Wi-Fi to wirelessly connect your Mac to the internet.",
  },
  bluetooth: {
    icon: <Bluetooth className="w-8 h-8" />,
    title: "Bluetooth",
    description: "Connect to accessories you can use for activities such as streaming music, making phone calls, and gaming.",
  },
  focus: {
    icon: <Moon className="w-8 h-8 fill-current" />,
    title: "Focus",
    description: "Choose when notifications and interruptions are allowed.",
  },
  "desktop-dock": {
    icon: <PanelBottom className="w-8 h-8" />,
    title: "Desktop & Dock",
    description: "Choose how items appear on the desktop and in the Dock.",
  },
  "menu-bar": {
    icon: <PanelTop className="w-8 h-8" />,
    title: "Menu Bar",
    description: "Choose how the clock appears in the menu bar.",
  },
};

export function Content({
  selectedCategory,
  selectedPanel,
  onPanelSelect,
  onCategorySelect,
  scrollToOSVersion,
  onScrollComplete,
}: ContentProps) {
  const info = categoryInfo[selectedCategory];

  // Show sub-panel if selected
  if (selectedPanel === "about") {
    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <AboutPanel onCategorySelect={onCategorySelect} />
      </div>
    );
  }

  if (selectedPanel === "personal-info") {
    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <PersonalInfoPanel />
      </div>
    );
  }

  if (selectedPanel === "storage") {
    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <StoragePanel />
      </div>
    );
  }

  if (selectedCategory === "focus") {
    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <FocusPanel />
      </div>
    );
  }

  if (selectedCategory === "menu-bar") {
    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <MenuBarPanel />
      </div>
    );
  }

  if (selectedCategory === "desktop-dock") {
    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <DesktopDockPanel />
      </div>
    );
  }

  if (selectedCategory === "wallpaper") {
    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <WallpaperPanel />
      </div>
    );
  }

  if (selectedCategory === "wifi" || selectedCategory === "bluetooth") {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        {selectedCategory === "wifi" && <WifiPanel />}
        {selectedCategory === "bluetooth" && <BluetoothPanel />}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="flex flex-col items-center py-8 px-4 border-b border-border/50">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-3">
          {info.icon}
        </div>
        <h1 className="text-base font-semibold mb-1">{info.title}</h1>
        <p className="text-xs text-muted-foreground text-center max-w-md">
          {info.description}
        </p>
      </div>
      <div className="p-4">
        {selectedCategory === "general" && (
          <GeneralPanel onPanelSelect={onPanelSelect} onCategorySelect={onCategorySelect} />
        )}
        {selectedCategory === "appearance" && (
          <AppearancePanel
            scrollToOSVersion={scrollToOSVersion}
            onScrollComplete={onScrollComplete}
          />
        )}
      </div>
    </div>
  );
}
