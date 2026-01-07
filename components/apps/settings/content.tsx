"use client";

import { Settings, Paintbrush } from "lucide-react";
import { SettingsCategory, SettingsPanel } from "./settings-app";
import { GeneralPanel } from "./panels/general";
import { AboutPanel } from "./panels/about";
import { AppearancePanel } from "./panels/appearance";
import { PersonalInfoPanel } from "./panels/personal-info";
import { cn } from "@/lib/utils";

interface ContentProps {
  selectedCategory: SettingsCategory;
  selectedPanel: SettingsPanel;
  onPanelSelect: (panel: SettingsPanel) => void;
  onBack: () => void;
  isMobile: boolean;
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
};

export function Content({
  selectedCategory,
  selectedPanel,
  onPanelSelect,
  onBack,
  isMobile,
}: ContentProps) {
  const info = categoryInfo[selectedCategory];

  // Show sub-panel if selected
  if (selectedPanel === "about") {
    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <AboutPanel />
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

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Header */}
      <div className="flex flex-col items-center py-8 px-4 border-b border-border/50">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-3">
          {info.icon}
        </div>
        <h1 className="text-xl font-semibold mb-1">{info.title}</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {info.description}
        </p>
      </div>

      {/* Panel content */}
      <div className="p-4">
        {selectedCategory === "general" && (
          <GeneralPanel onPanelSelect={onPanelSelect} />
        )}
        {selectedCategory === "appearance" && <AppearancePanel />}
      </div>
    </div>
  );
}
