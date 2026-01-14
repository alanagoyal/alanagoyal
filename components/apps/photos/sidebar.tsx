"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collection, PhotosView } from "@/types/photos";
import { Images, Heart, FolderOpen } from "lucide-react";

interface SidebarProps {
  children: React.ReactNode;
  collections: Collection[];
  activeView: PhotosView;
  onViewSelect: (view: PhotosView) => void;
  isMobileView: boolean;
  onScroll?: (isScrolled: boolean) => void;
}

export function Sidebar({
  children,
  collections,
  activeView,
  onViewSelect,
  isMobileView,
  onScroll,
}: SidebarProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full",
        isMobileView ? "bg-background" : "bg-muted"
      )}
    >
      {children}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea
          className="h-full"
          bottomMargin="0"
          onScrollCapture={(e) => {
            const target = e.target as HTMLElement;
            onScroll?.(target.scrollTop > 0);
          }}
        >
          <div className={cn("px-2 py-2", isMobileView ? "w-full" : "w-[220px]")}>
            {/* Library Section */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground px-3 py-1 font-semibold uppercase tracking-wide">
                Library
              </p>
              <SidebarItem
                icon={<Images className="w-4 h-4" />}
                label="Library"
                isActive={activeView === "library"}
                onClick={() => onViewSelect("library")}
                isMobileView={isMobileView}
              />
              <SidebarItem
                icon={<Heart className="w-4 h-4" />}
                label="Favorites"
                isActive={activeView === "favorites"}
                onClick={() => onViewSelect("favorites")}
                isMobileView={isMobileView}
              />
            </div>

            {/* Collections Section */}
            {collections.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground px-3 py-1 font-semibold uppercase tracking-wide">
                  Collections
                </p>
                {collections.map((collection) => (
                  <SidebarItem
                    key={collection.id}
                    icon={<FolderOpen className="w-4 h-4" />}
                    label={collection.name}
                    isActive={activeView === collection.id}
                    onClick={() => onViewSelect(collection.id)}
                    isMobileView={isMobileView}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  isActive,
  onClick,
  isMobileView,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isMobileView: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
        isActive
          ? "bg-zinc-200/70 dark:bg-zinc-700/70 text-blue-500"
          : "text-foreground",
        isMobileView && "py-3"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
