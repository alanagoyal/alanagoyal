"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useMusic } from "@/lib/music/use-music";
import { useAudio } from "@/lib/music/audio-context";
import { useWindowFocus } from "@/lib/window-focus-context";
import { MusicView } from "./types";
import { Sidebar } from "./sidebar";
import { Nav } from "./nav";
import { NowPlayingBar } from "./now-playing-bar";
import {
  HomeView,
  ArtistsView,
  AlbumsView,
  SongsView,
  PlaylistView,
  RecentlyAddedView,
} from "./content-views";

interface AppProps {
  isDesktop?: boolean;
  inShell?: boolean;
}

export default function App({ isDesktop = false, inShell = false }: AppProps) {
  const {
    playlists,
    featuredPlaylist,
    albums,
    artists,
    songs,
    nowPlaying,
    recentlyPlayed,
    topArtists,
    topTracks,
    loading,
  } = useMusic();

  const { playbackState, pause, resume, next, previous } = useAudio();

  const [activeView, setActiveView] = useState<MusicView>("home");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLayoutInitialized, setIsLayoutInitialized] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const windowFocus = useWindowFocus();

  // Mobile view detection
  useEffect(() => {
    if (!isDesktop) {
      setIsMobileView(true);
      setIsLayoutInitialized(true);
      return;
    }

    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    setIsLayoutInitialized(true);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDesktop]);

  // Handle view selection
  const handleViewSelect = useCallback((view: MusicView, playlistId?: string) => {
    setActiveView(view);
    if (view === "playlist" && playlistId) {
      setSelectedPlaylistId(playlistId);
    } else {
      setSelectedPlaylistId(null);
    }
    setShowContent(true);
  }, []);

  const handleBack = useCallback(() => {
    setShowContent(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if not focused in shell mode
      if (inShell && windowFocus && !windowFocus.isFocused) return;

      // Don't handle if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (playbackState.isPlaying) {
            pause();
          } else {
            resume();
          }
          break;
        case "ArrowRight":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            next();
          }
          break;
        case "ArrowLeft":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            previous();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inShell, windowFocus, playbackState.isPlaying, pause, resume, next, previous]);

  // Get selected playlist
  const selectedPlaylist = selectedPlaylistId
    ? playlists.find((p) => p.id === selectedPlaylistId)
    : null;

  if (!isLayoutInitialized) {
    return <div className="h-full bg-background" />;
  }

  // Mobile: show either sidebar or content
  // Desktop: show both side by side
  const showSidebar = !isMobileView || !showContent;
  const showMainContent = !isMobileView || showContent;

  const renderContent = () => {
    if (loading && activeView === "home") {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      );
    }

    switch (activeView) {
      case "home":
        return (
          <HomeView
            featuredPlaylist={featuredPlaylist}
            recentlyPlayed={recentlyPlayed}
            nowPlaying={nowPlaying}
            playlists={playlists}
            onPlaylistSelect={(id) => handleViewSelect("playlist", id)}
            isMobileView={isMobileView}
          />
        );
      case "recently-added":
        return (
          <RecentlyAddedView
            songs={songs}
            recentlyPlayed={recentlyPlayed}
            isMobileView={isMobileView}
          />
        );
      case "artists":
        return (
          <ArtistsView
            artists={artists}
            topArtists={topArtists}
            isMobileView={isMobileView}
          />
        );
      case "albums":
        return <AlbumsView albums={albums} isMobileView={isMobileView} />;
      case "songs":
        return (
          <SongsView
            songs={songs}
            topTracks={topTracks}
            isMobileView={isMobileView}
          />
        );
      case "playlist":
        return selectedPlaylist ? (
          <PlaylistView playlist={selectedPlaylist} isMobileView={isMobileView} />
        ) : (
          <HomeView
            featuredPlaylist={featuredPlaylist}
            recentlyPlayed={recentlyPlayed}
            nowPlaying={nowPlaying}
            playlists={playlists}
            onPlaylistSelect={(id) => handleViewSelect("playlist", id)}
            isMobileView={isMobileView}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      data-app="music"
      tabIndex={-1}
      onMouseDown={() => containerRef.current?.focus()}
      className="music-app h-full flex flex-col bg-background text-foreground outline-none overflow-hidden"
    >
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "h-full flex-shrink-0 overflow-hidden",
            showSidebar
              ? isMobileView
                ? "block w-full"
                : "block w-[220px] border-r dark:border-foreground/20"
              : "hidden"
          )}
        >
          <Sidebar
            playlists={playlists}
            activeView={activeView}
            selectedPlaylistId={selectedPlaylistId}
            onViewSelect={handleViewSelect}
            isMobileView={isMobileView}
            onScroll={setIsScrolled}
          >
            <Nav
              isMobileView={isMobileView}
              isScrolled={isScrolled}
              isDesktop={isDesktop}
            />
          </Sidebar>
        </div>

        {/* Main Content */}
        <div
          className={cn(
            "flex-1 flex flex-col min-h-0 overflow-auto",
            showMainContent ? "block" : "hidden"
          )}
        >
          {renderContent()}
        </div>
      </main>

      {/* Now Playing Bar */}
      <NowPlayingBar isMobileView={isMobileView} />
    </div>
  );
}
