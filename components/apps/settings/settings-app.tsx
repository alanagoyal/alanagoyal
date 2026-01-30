"use client";

import { useState, useCallback, useEffect } from "react";
import { Nav } from "./nav";
import { Sidebar } from "./sidebar";
import { Content } from "./content";
import { loadSettingsState, saveSettingsState } from "@/lib/sidebar-persistence";

export type SettingsCategory = "general" | "appearance" | "wifi" | "bluetooth";
export type SettingsPanel = "about" | "personal-info" | "storage" | null;

interface HistoryEntry {
  category: SettingsCategory;
  panel: SettingsPanel;
}

interface SettingsAppProps {
  isMobile?: boolean;
  inShell?: boolean;
  initialPanel?: SettingsPanel; // Allow opening directly to a panel
  initialCategory?: SettingsCategory; // Allow opening directly to a category
}

export function SettingsApp({ isMobile = false, inShell = false, initialPanel, initialCategory }: SettingsAppProps) {
  // Load persisted state (props take precedence if provided)
  const getInitialState = (): HistoryEntry => {
    if (initialCategory || initialPanel) {
      return { category: initialCategory || "general", panel: initialPanel || null };
    }
    const saved = loadSettingsState();
    return { category: saved.category, panel: saved.panel };
  };

  const [history, setHistory] = useState<HistoryEntry[]>(() => [getInitialState()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [scrollToOSVersion, setScrollToOSVersion] = useState(false);

  // Handle initialPanel/initialCategory changes (e.g., from menu bar)
  useEffect(() => {
    if (initialPanel || initialCategory) {
      setHistory([{ category: initialCategory || "general", panel: initialPanel || null }]);
      setHistoryIndex(0);
    }
  }, [initialPanel, initialCategory]);
  const [showSidebar, setShowSidebar] = useState(true);

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
    if (isMobile) {
      setShowSidebar(false);
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
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleBack = () => {
    if (isMobile) {
      // On mobile, back behavior is simpler:
      // If on a sub-panel (like About), go back to the category
      if (selectedPanel !== null) {
        // Go back to category page
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ category: selectedCategory, panel: null });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } else {
        // On a main category page, go back to sidebar
        setShowSidebar(true);
      }
    } else {
      // Desktop uses history navigation
      if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
      }
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  // On mobile, always show back when not on sidebar
  const canGoBack = isMobile ? !showSidebar : historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const getNavTitle = () => {
    // Only show title for sub-panels on mobile, not main categories
    if (selectedPanel === "about") return "About";
    if (selectedPanel === "personal-info") return "Personal Information";
    if (selectedPanel === "storage") return "Storage";
    // Don't show title for General/Appearance/Bluetooth on mobile (it's in the content card)
    if (!isMobile) {
      if (selectedCategory === "general") return "General";
      if (selectedCategory === "appearance") return "Appearance";
      if (selectedCategory === "wifi") return "Wi-Fi";
      if (selectedCategory === "bluetooth") return "Bluetooth";
    }
    return undefined;
  };

  const getBackTitle = () => {
    if (!isMobile) return "";

    // When on a sub-panel, show the parent category name
    if (selectedPanel === "about") return "General";
    if (selectedPanel === "personal-info") return "Settings";
    if (selectedPanel === "storage") return "General";

    // When on a main category page, show "Settings" to go back to sidebar
    return "Settings";
  };

  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-muted/30" data-app="settings">
        {showSidebar ? (
          <Sidebar
            selectedCategory={selectedCategory}
            selectedPanel={selectedPanel}
            onCategorySelect={handleCategorySelect}
            onAccountClick={handleAccountClick}
            isMobile={isMobile}
            isDesktop={inShell}
          />
        ) : (
          <>
            <Nav
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              onBack={handleBack}
              onForward={handleForward}
              isMobile={isMobile}
              isDesktop={inShell}
              title={getNavTitle()}
              backTitle={getBackTitle()}
            />
            <Content
              selectedCategory={selectedCategory}
              selectedPanel={selectedPanel}
              onPanelSelect={handlePanelSelect}
              onCategorySelect={handleCategorySelect}
              onBack={handleBack}
              isMobile={isMobile}
              scrollToOSVersion={scrollToOSVersion}
              onScrollComplete={handleScrollComplete}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background" data-app="settings">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedCategory={selectedCategory}
          selectedPanel={selectedPanel}
          onCategorySelect={handleCategorySelect}
          onAccountClick={handleAccountClick}
          isMobile={isMobile}
          isDesktop={inShell}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Nav
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onBack={handleBack}
            onForward={handleForward}
            isMobile={isMobile}
            isDesktop={inShell}
            title={getNavTitle()}
            backTitle={getBackTitle()}
          />
          <Content
            selectedCategory={selectedCategory}
            selectedPanel={selectedPanel}
            onPanelSelect={handlePanelSelect}
            onCategorySelect={handleCategorySelect}
            onBack={handleBack}
            isMobile={isMobile}
            scrollToOSVersion={scrollToOSVersion}
            onScrollComplete={handleScrollComplete}
          />
        </div>
      </div>
    </div>
  );
}
