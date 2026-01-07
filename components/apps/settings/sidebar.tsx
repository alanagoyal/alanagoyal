"use client";

import Image from "next/image";
import { Settings, Paintbrush, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { SettingsCategory } from "./settings-app";

interface SidebarProps {
  selectedCategory: SettingsCategory;
  selectedPanel: "about" | "personal-info" | null;
  onCategorySelect: (category: SettingsCategory) => void;
  onAccountClick: () => void;
  isMobile: boolean;
  isDesktop?: boolean;
}

const categories: { id: SettingsCategory; name: string; icon: React.ReactNode }[] = [
  {
    id: "general",
    name: "General",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    id: "appearance",
    name: "Appearance",
    icon: <Paintbrush className="w-5 h-5" />,
  },
];

export function Sidebar({
  selectedCategory,
  selectedPanel,
  onCategorySelect,
  onAccountClick,
  isMobile,
  isDesktop = false,
}: SidebarProps) {
  const windowFocus = useWindowFocus();
  const inShell = isDesktop && windowFocus;

  return (
    <div
      className={cn(
        "flex flex-col h-full select-none",
        isMobile ? "w-full bg-background" : "w-[280px] bg-muted border-r border-border/50"
      )}
    >
      {/* Window controls - only on desktop sidebar */}
      {!isMobile && (
        <div
          className={cn(
            "px-4 py-2 flex items-center",
            inShell && !windowFocus?.isMaximized && "cursor-grab active:cursor-grabbing"
          )}
          onMouseDown={inShell ? windowFocus?.onDragStart : undefined}
        >
          <div className="window-controls flex items-center gap-1.5 p-2">
            {inShell ? (
              <>
                <button
                  onClick={windowFocus.closeWindow}
                  className="cursor-pointer w-3 h-3 rounded-full bg-red-500 hover:bg-red-700"
                  aria-label="Close window"
                />
                <button
                  onClick={windowFocus.minimizeWindow}
                  className="cursor-pointer w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-700"
                  aria-label="Minimize window"
                />
                <button
                  onClick={windowFocus.toggleMaximize}
                  className="cursor-pointer w-3 h-3 rounded-full bg-green-500 hover:bg-green-700"
                  aria-label={windowFocus.isMaximized ? "Restore window" : "Maximize window"}
                />
              </>
            ) : !isDesktop ? (
              <>
                <button
                  onClick={() => window.close()}
                  className="cursor-pointer w-3 h-3 rounded-full bg-red-500 hover:bg-red-700"
                  aria-label="Close tab"
                />
                <button className="w-3 h-3 rounded-full bg-yellow-500 cursor-default" />
                <button className="w-3 h-3 rounded-full bg-green-500 cursor-default" />
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-md border border-border/50">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search</span>
        </div>
      </div>

      {/* Apple Account */}
      <div className="px-3 py-2">
        <button
          onClick={onAccountClick}
          className={cn(
            "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
            selectedPanel === "personal-info"
              ? "bg-blue-500 text-white"
              : "hover:bg-background/50"
          )}
        >
          <Image
            src="/headshot.jpg"
            alt="Alana Goyal"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div className="text-left">
            <div className="font-medium text-sm">Alana Goyal</div>
            <div className={cn(
              "text-xs",
              selectedPanel === "personal-info" ? "text-white/70" : "text-muted-foreground"
            )}>Apple Account</div>
          </div>
        </button>
      </div>

      {/* Categories */}
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="space-y-0.5">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id && selectedPanel !== "personal-info";
            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "hover:bg-background/50 text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-md",
                    isSelected
                      ? "bg-white/20"
                      : "bg-muted-foreground/10"
                  )}
                >
                  {category.icon}
                </span>
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
