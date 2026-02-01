"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartAlbum, ChartSong, PlaylistTrack } from "../types";
import { useAudio } from "@/lib/music/audio-context";
import { ChevronLeft, ChevronRight, Play, Pause, Loader2 } from "lucide-react";

interface BrowseViewProps {
  isMobileView: boolean;
}

interface ChartGridProps {
  title: string;
  items: (ChartAlbum | ChartSong)[];
  isMobileView: boolean;
  loadingTrack: string | null;
  isItemPlaying: (item: ChartAlbum | ChartSong) => boolean;
  isItemActive: (item: ChartAlbum | ChartSong) => boolean;
  onPlay: (item: ChartAlbum | ChartSong) => void;
}

function ChartGrid({
  title,
  items,
  isMobileView,
  loadingTrack,
  isItemPlaying,
  isItemActive,
  onPlay,
}: ChartGridProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div
        className={cn(
          "grid gap-4",
          isMobileView ? "grid-cols-2" : "grid-cols-3 lg:grid-cols-5"
        )}
      >
        {items.map((item) => {
          const isPlaying = isItemPlaying(item);
          const isActive = isItemActive(item);
          return (
            <div
              key={item.id}
              onClick={() => onPlay(item)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                <Image
                  src={item.albumArt}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div
                  className={cn(
                    "absolute inset-0 transition-colors flex items-center justify-center",
                    isActive ? "bg-black/40" : "bg-black/0 group-hover:bg-black/40"
                  )}
                >
                  {loadingTrack === item.id ? (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-10 h-10 text-white" />
                  ) : isActive ? (
                    <Play className="w-10 h-10 text-white" />
                  ) : (
                    <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.artist}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BrowseView({ isMobileView }: BrowseViewProps) {
  const { play, pause, playbackState } = useAudio();
  const [topAlbums, setTopAlbums] = useState<ChartAlbum[]>([]);
  const [topSongs, setTopSongs] = useState<ChartSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCharts() {
      try {
        const [albumsRes, songsRes] = await Promise.all([
          fetch("/api/music/charts?type=albums&limit=10"),
          fetch("/api/music/charts?type=songs&limit=20"),
        ]);
        const albumsData = await albumsRes.json();
        const songsData = await songsRes.json();
        setTopAlbums(albumsData.items || []);
        setTopSongs(songsData.items || []);
      } catch (error) {
        console.error("Failed to fetch charts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCharts();
  }, []);


  const handleCarouselPrev = () => {
    setCarouselIndex((prev) =>
      prev === 0 ? topAlbums.length - 1 : prev - 1
    );
  };

  const handleCarouselNext = () => {
    setCarouselIndex((prev) => (prev + 1) % topAlbums.length);
  };

  // Clear playingItemId when track is cleared (e.g., playback ends)
  useEffect(() => {
    if (!playbackState.currentTrack) {
      setPlayingItemId(null);
    }
  }, [playbackState.currentTrack]);

  // Check if an item is currently playing (or paused but selected)
  const isItemPlaying = (item: ChartAlbum | ChartSong) => {
    return playingItemId === item.id && playbackState.isPlaying;
  };

  const isItemActive = (item: ChartAlbum | ChartSong) => {
    return playingItemId === item.id && !!playbackState.currentTrack;
  };

  const handlePlayItem = async (item: ChartAlbum | ChartSong) => {
    // If this item is already playing, pause it
    if (playingItemId === item.id && playbackState.isPlaying) {
      pause();
      return;
    }

    // If this item was paused, resume it
    if (playingItemId === item.id && !playbackState.isPlaying && playbackState.currentTrack) {
      play(playbackState.currentTrack, playbackState.queue);
      return;
    }

    setLoadingTrack(item.id);
    try {
      // Search for track preview URL via server-side API
      const searchQuery = `${item.artist} ${item.name}`;
      const response = await fetch(
        `/api/music/search?term=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();

      // Find best match from server response
      const results = data.results || [];
      const result = results.find(
        (r: { previewUrl?: string; trackName: string }) =>
          r.previewUrl &&
          r.trackName.toLowerCase().includes(item.name.toLowerCase().split(" ")[0])
      ) || results[0];

      if (result?.previewUrl) {
        const track: PlaylistTrack = {
          id: `itunes-${result.trackId}`,
          name: result.trackName,
          artist: result.artistName,
          album: result.collectionName,
          albumArt: result.artworkUrl100?.replace("100x100", "600x600") || item.albumArt,
          previewUrl: result.previewUrl,
          duration: Math.floor(result.trackTimeMillis / 1000),
        };
        setPlayingItemId(item.id);
        play(track, [track]);
      }
    } catch (error) {
      console.error("Failed to search track:", error);
    } finally {
      setLoadingTrack(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" bottomMargin="0">
      <div className={cn("p-6", isMobileView && "p-4 pb-20")}>
        {/* Featured Carousel */}
        {topAlbums.length > 0 && (
          <div className="mb-8">
            <div className="relative group">
              {/* Carousel Container */}
              <div className="relative overflow-hidden rounded-xl aspect-[21/9] bg-muted">
                {topAlbums.map((album, index) => (
                  <div
                    key={album.id}
                    className={cn(
                      "absolute inset-0 transition-all duration-500 ease-in-out cursor-pointer",
                      index === carouselIndex
                        ? "opacity-100 translate-x-0"
                        : index < carouselIndex
                        ? "opacity-0 -translate-x-full"
                        : "opacity-0 translate-x-full"
                    )}
                    onClick={() => handlePlayItem(album)}
                  >
                    <Image
                      src={album.albumArt}
                      alt={album.name}
                      fill
                      className="object-cover"
                      unoptimized
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-white/70 text-sm font-medium mb-1">
                        {album.artist}
                      </p>
                      <h2 className="text-white text-2xl md:text-3xl font-bold mb-1">
                        {album.name}
                      </h2>
                      <p className="text-white/60 text-sm">
                        {album.genre} · {album.releaseDate}
                      </p>
                    </div>
                    {loadingTrack === album.id && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCarouselPrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCarouselNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {topAlbums.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarouselIndex(index);
                    }}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      index === carouselIndex
                        ? "bg-white"
                        : "bg-white/40 hover:bg-white/60"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <ChartGrid
          title="Top Songs"
          items={topSongs}
          isMobileView={isMobileView}
          loadingTrack={loadingTrack}
          isItemPlaying={isItemPlaying}
          isItemActive={isItemActive}
          onPlay={handlePlayItem}
        />

        <ChartGrid
          title="Top Albums"
          items={topAlbums}
          isMobileView={isMobileView}
          loadingTrack={loadingTrack}
          isItemPlaying={isItemPlaying}
          isItemActive={isItemActive}
          onPlay={handlePlayItem}
        />
      </div>
    </ScrollArea>
  );
}
