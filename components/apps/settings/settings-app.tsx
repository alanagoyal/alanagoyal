"use client";

import { useState, useCallback, useEffect } from "react";
import { Nav } from "./nav";
import { Sidebar } from "./sidebar";
import { Content } from "./content";
import { loadSettingsState, saveSettingsState } from "@/lib/sidebar-persistence";

export type SettingsCategory = "general" | "appearance" | "wallpaper" | "wifi" | "bluetooth" | "focus" | "desktop-dock" | "menu-bar";
export type SettingsPanel = "about" | "personal-info" | "storage" | null;

interface HistoryEntry {
  category: SettingsCategory;
  panel: SettingsPanel;
}

interface SettingsAppProps {
  inShell?: boolean;
  initialPanel?: SettingsPanel; // Allow opening directly to a panel
  initialCategory?: SettingsCategory; // Allow opening directly to a category
  navigationRequestId?: number;
}

export function SettingsApp({ inShell = false, initialPanel, initialCategory, navigationRequestId }: SettingsAppProps) {
  // Load persisted state (props take precedence if provided)
  const getInitialState = (): HistoryEntry => {
    if (initialCategory || initialPanel) {
      return {
        category: initialCategory || "general",
        panel: initialPanel || null,
      };
    }
    const saved = loadSettingsState();
    return {
      category: saved.category,
      panel: saved.panel,
    };
  };

  const [history, setHistory] = useState<HistoryEntry[]>(() => [getInitialState()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [scrollToOSVersion, setScrollToOSVersion] = useState(false);

  // Handle initialPanel/initialCategory changes (e.g., from menu bar)
  useEffect(() => {
    if (initialPanel || initialCategory) {
      setHistory([{
        category: initialCategory || "general",
        panel: initialPanel || null,
      }]);
      setHistoryIndex(0);
    }
  }, [initialPanel, initialCategory, navigationRequestId]);

  // Persist settings state
  useEffect(() => {
    const currentState = history[historyIndex];
    if (currentState) {
      saveSettingsState(currentState.category, currentState.panel);
    }
  }, [history, historyIndex]);

  const currentState = history[historyIndex];
  const selectedCategory = currentState.category;
  const selectedPanel = currentState.panel;

  const navigate = useCallback((category: SettingsCategory, panel: SettingsPanel) => {
    // Remove any forward history and add new entry
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ category, panel });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleCategorySelect = (category: SettingsCategory, options?: { scrollToOSVersion?: boolean }) => {
    navigate(category, null);
    if (options?.scrollToOSVersion) {
      setScrollToOSVersion(true);
    }
  };

  const handleScrollComplete = useCallback(() => {
    setScrollToOSVersion(false);
  }, []);

  const handlePanelSelect = (panel: SettingsPanel) => {
    navigate(selectedCategory, panel);
  };

  const handleAccountClick = () => {
    navigate(selectedCategory, "personal-info");
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const getNavTitle = () => {
    if (selectedPanel === "about") return "About";
    if (selectedPanel === "personal-info") return "Personal Information";
    if (selectedPanel === "storage") return "Storage";
    if (selectedCategory === "general") return "General";
    if (selectedCategory === "appearance") return "Appearance";
    if (selectedCategory === "wallpaper") return "Wallpaper";
    if (selectedCategory === "wifi") return "Wi-Fi";
    if (selectedCategory === "bluetooth") return "Bluetooth";
    if (selectedCategory === "focus") return "Focus";
    if (selectedCategory === "desktop-dock") return "Desktop & Dock";
    if (selectedCategory === "menu-bar") return "Menu Bar";
    return undefined;
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background" data-app="settings">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedCategory={selectedCategory}
          selectedPanel={selectedPanel}
          onCategorySelect={handleCategorySelect}
          onAccountClick={handleAccountClick}
          isDesktop={inShell}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Nav
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onBack={handleBack}
            onForward={handleForward}
            isDesktop={inShell}
            title={getNavTitle()}
          />
          <Content
            selectedCategory={selectedCategory}
            selectedPanel={selectedPanel}
            onPanelSelect={handlePanelSelect}
            onCategorySelect={handleCategorySelect}
            scrollToOSVersion={scrollToOSVersion}
            onScrollComplete={handleScrollComplete}
          />
        </div>
      </div>
    </div>
  );
}
