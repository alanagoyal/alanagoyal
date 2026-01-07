"use client";

import { useState, useCallback } from "react";
import { Nav } from "./nav";
import { Sidebar } from "./sidebar";
import { Content } from "./content";

export type SettingsCategory = "general" | "appearance";
export type SettingsPanel = "about" | "personal-info" | null;

interface HistoryEntry {
  category: SettingsCategory;
  panel: SettingsPanel;
}

interface SettingsAppProps {
  isMobile?: boolean;
  inShell?: boolean;
}

export function SettingsApp({ isMobile = false, inShell = false }: SettingsAppProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([{ category: "general", panel: null }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);

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

  const handleCategorySelect = (category: SettingsCategory) => {
    navigate(category, null);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

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
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    } else if (isMobile && !showSidebar) {
      setShowSidebar(true);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const canGoBack = historyIndex > 0 || (isMobile && !showSidebar);
  const canGoForward = historyIndex < history.length - 1;

  const getNavTitle = () => {
    if (selectedPanel === "personal-info") return "Personal Information";
    return undefined;
  };

  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-background" data-app="settings">
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
            />
            <Content
              selectedCategory={selectedCategory}
              selectedPanel={selectedPanel}
              onPanelSelect={handlePanelSelect}
              onBack={handleBack}
              isMobile={isMobile}
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
          />
          <Content
            selectedCategory={selectedCategory}
            selectedPanel={selectedPanel}
            onPanelSelect={handlePanelSelect}
            onBack={handleBack}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}
