"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MusicView, Playlist } from "./types";
import { Home, Clock, User, Disc3, Music, ListMusic } from "lucide-react";

interface SidebarProps {
  children: React.ReactNode;
  playlists: Playlist[];
  activeView: MusicView;
  selectedPlaylistId: string | null;
  onViewSelect: (view: MusicView, playlistId?: string) => void;
  isMobileView: boolean;
  onScroll?: (isScrolled: boolean) => void;
}

export function Sidebar({
  children,
  playlists,
  activeView,
  selectedPlaylistId,
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
            {/* Main */}
            <div className="mb-4">
              <SidebarItem
                icon={<Home className="w-4 h-4" />}
                label="Home"
                isActive={activeView === "home"}
                onClick={() => onViewSelect("home")}
                isMobileView={isMobileView}
              />
            </div>

            {/* Library Section */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground px-3 py-1 font-semibold uppercase tracking-wide">
                Library
              </p>
              <SidebarItem
                icon={<Clock className="w-4 h-4" />}
                label="Recently Added"
                isActive={activeView === "recently-added"}
                onClick={() => onViewSelect("recently-added")}
                isMobileView={isMobileView}
              />
              <SidebarItem
                icon={<User className="w-4 h-4" />}
                label="Artists"
                isActive={activeView === "artists"}
                onClick={() => onViewSelect("artists")}
                isMobileView={isMobileView}
              />
              <SidebarItem
                icon={<Disc3 className="w-4 h-4" />}
                label="Albums"
                isActive={activeView === "albums"}
                onClick={() => onViewSelect("albums")}
                isMobileView={isMobileView}
              />
              <SidebarItem
                icon={<Music className="w-4 h-4" />}
                label="Songs"
                isActive={activeView === "songs"}
                onClick={() => onViewSelect("songs")}
                isMobileView={isMobileView}
              />
            </div>

            {/* Playlists Section */}
            {playlists.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground px-3 py-1 font-semibold uppercase tracking-wide">
                  Playlists
                </p>
                {playlists.map((playlist) => (
                  <SidebarItem
                    key={playlist.id}
                    icon={<ListMusic className="w-4 h-4" />}
                    label={playlist.name}
                    isActive={activeView === "playlist" && selectedPlaylistId === playlist.id}
                    onClick={() => onViewSelect("playlist", playlist.id)}
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
        isActive && !isMobileView
          ? "bg-zinc-200/70 dark:bg-zinc-700/70 text-red-500"
          : "text-foreground",
        isMobileView && "py-3"
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
