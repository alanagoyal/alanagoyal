"use client";

import { Settings, Paintbrush, Bluetooth, Wifi } from "lucide-react";
import { SettingsCategory, SettingsPanel } from "./settings-app";
import { GeneralPanel } from "./panels/general";
import { AboutPanel } from "./panels/about";
import { AppearancePanel } from "./panels/appearance";
import { PersonalInfoPanel } from "./panels/personal-info";
import { BluetoothPanel } from "./panels/bluetooth";
import { WifiPanel } from "./panels/wifi";
import { StoragePanel } from "./panels/storage";
import { cn } from "@/lib/utils";

interface ContentProps {
  selectedCategory: SettingsCategory;
  selectedPanel: SettingsPanel;
  onPanelSelect: (panel: SettingsPanel) => void;
  onCategorySelect: (category: SettingsCategory, options?: { scrollToOSVersion?: boolean }) => void;
  onBack: () => void;
  isMobile: boolean;
  scrollToOSVersion?: boolean;
  onScrollComplete?: () => void;
}

const categoryInfo: Record<
  SettingsCategory,
  { icon: React.ReactNode; title: string; description: string; iconBg?: string }
> = {
  general: {
    icon: <Settings className="w-8 h-8" />,
    title: "General",
    description: "Manage your overall setup and preferences for iPhone, such as software updates, device language, CarPlay, AirDrop, and more.",
    iconBg: "bg-gray-500",
  },
  appearance: {
    icon: <Paintbrush className="w-8 h-8" />,
    title: "Appearance",
    description: "Customize the look and feel of your Mac.",
    iconBg: "bg-blue-500",
  },
  wifi: {
    icon: <Wifi className="w-8 h-8" />,
    title: "Wi-Fi",
    description: "Set up Wi-Fi to wirelessly connect your Mac to the internet.",
    iconBg: "bg-blue-500",
  },
  bluetooth: {
    icon: <Bluetooth className="w-8 h-8" />,
    title: "Bluetooth",
    description: "Connect to accessories you can use for activities such as streaming music, making phone calls, and gaming.",
    iconBg: "bg-blue-500",
  },
};

export function Content({
  selectedCategory,
  selectedPanel,
  onPanelSelect,
  onCategorySelect,
  onBack,
  isMobile,
  scrollToOSVersion,
  onScrollComplete,
}: ContentProps) {
  const info = categoryInfo[selectedCategory];

  // Show sub-panel if selected
  if (selectedPanel === "about") {
    return (
      <div className={cn("flex-1 overflow-y-auto", isMobile ? "bg-muted/30" : "bg-background")}>
        <AboutPanel isMobile={isMobile} onCategorySelect={onCategorySelect} />
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
      <div className={cn("flex-1 overflow-y-auto", isMobile ? "bg-muted/30" : "bg-background")}>
        <StoragePanel isMobile={isMobile} />
      </div>
    );
  }

  // Bluetooth has its own full mobile layout
  if (selectedCategory === "bluetooth" && isMobile) {
    return (
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <BluetoothPanel isMobile={isMobile} />
      </div>
    );
  }

  // Get icon background color for mobile
  const iconBgColor = selectedCategory === "general" ? "bg-gray-500" : "bg-blue-500";

  // Wi-Fi and Bluetooth have their own header layout on desktop
  if (!isMobile && (selectedCategory === "wifi" || selectedCategory === "bluetooth")) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        {selectedCategory === "wifi" && <WifiPanel isMobile={isMobile} />}
        {selectedCategory === "bluetooth" && <BluetoothPanel isMobile={isMobile} />}
      </div>
    );
  }

  return (
    <div className={cn("flex-1 overflow-y-auto", isMobile ? "bg-muted/30" : "bg-background")}>
      {isMobile ? (
        // Mobile: iOS-style layout with card containing icon, title, description
        <div className="px-4 py-4 space-y-4">
          {/* Header card */}
          <div className="rounded-xl bg-background p-4">
            <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl mb-3", iconBgColor)}>
              {selectedCategory === "general" ? (
                <Settings className="w-7 h-7 text-white" />
              ) : (
                <Paintbrush className="w-7 h-7 text-white" />
              )}
            </div>
            <h1 className="text-xl font-bold mb-1">{info.title}</h1>
            <p className="text-sm text-muted-foreground">
              {info.description}
            </p>
          </div>

          {/* Panel content */}
          {selectedCategory === "general" && (
            <GeneralPanel onPanelSelect={onPanelSelect} onCategorySelect={onCategorySelect} isMobile={isMobile} />
          )}
          {selectedCategory === "appearance" && (
            <AppearancePanel
              isMobile={isMobile}
              scrollToOSVersion={scrollToOSVersion}
              onScrollComplete={onScrollComplete}
            />
          )}
        </div>
      ) : (
        // Desktop layout for General and Appearance
        <>
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
              <GeneralPanel onPanelSelect={onPanelSelect} onCategorySelect={onCategorySelect} isMobile={isMobile} />
            )}
            {selectedCategory === "appearance" && (
              <AppearancePanel
                isMobile={isMobile}
                scrollToOSVersion={scrollToOSVersion}
                onScrollComplete={onScrollComplete}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
