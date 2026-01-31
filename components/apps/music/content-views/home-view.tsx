"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Playlist } from "../types";
import { useAudio } from "@/lib/music/audio-context";
import { Play, Pause } from "lucide-react";

interface HomeViewProps {
  playlists: Playlist[];
  onPlaylistSelect: (playlistId: string) => void;
  isMobileView: boolean;
}

export function HomeView({
  playlists,
  onPlaylistSelect,
  isMobileView,
}: HomeViewProps) {
  const { playbackState, play, pause } = useAudio();

  const handlePlayPlaylist = (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    const isPlayingThisPlaylist =
      playbackState.isPlaying &&
      playbackState.currentTrack &&
      playlist.tracks.some((t) => t.id === playbackState.currentTrack?.id);

    if (isPlayingThisPlaylist) {
      pause();
    } else {
      onPlaylistSelect(playlist.id);
      const firstPlayable = playlist.tracks.find((t) => t.previewUrl);
      if (firstPlayable) {
        play(firstPlayable, playlist.tracks);
      }
    }
  };

  return (
    <ScrollArea className="h-full" bottomMargin="0">
      <div className={cn("p-6", isMobileView && "p-4 pb-20")}>
        {/* Apple Music Promo Banner */}
        <div className="mb-8">
          <a
            href="https://apple.com/music"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "relative block rounded-xl overflow-hidden bg-gradient-to-b from-[#fc3c44] to-[#e82934] hover:opacity-95 transition-opacity",
              isMobileView ? "py-6 px-4" : "py-8 px-6"
            )}
          >
            <div className="flex flex-col items-center text-center text-white">
              <p className="text-sm font-medium mb-4">
                Get 3 months for $3.99/month.
              </p>
              <div className="flex items-center gap-1 mb-4">
                {/* Apple Logo */}
                <svg
                  className={cn(isMobileView ? "w-8 h-8" : "w-10 h-10")}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className={cn("font-semibold", isMobileView ? "text-3xl" : "text-4xl")}>
                  Music
                </span>
              </div>
              <p className="text-sm font-medium">Try Apple Music</p>
              <p className="text-xs text-white/80">
                3 months for $3.99/month, then $10.99/month
              </p>
            </div>
          </a>
        </div>

        {/* Your Playlists */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Your Playlists</h2>
          <div
            className={cn(
              "grid gap-4",
              isMobileView ? "grid-cols-2" : "grid-cols-3 lg:grid-cols-5"
            )}
          >
            {playlists.map((playlist) => {
              const isPlaying =
                playbackState.isPlaying &&
                playbackState.currentTrack &&
                playlist.tracks.some((t) => t.id === playbackState.currentTrack?.id);

              return (
                <div
                  key={playlist.id}
                  onClick={() => onPlaylistSelect(playlist.id)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                    {playlist.tracks[0]?.albumArt ? (
                      <Image
                        src={playlist.tracks[0].albumArt}
                        alt={playlist.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800" />
                    )}
                    <div
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center"
                      onClick={(e) => handlePlayPlaylist(playlist, e)}
                    >
                      {isPlaying ? (
                        <Pause className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium truncate">{playlist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {playlist.tracks.length} songs
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </ScrollArea>
  );
}
