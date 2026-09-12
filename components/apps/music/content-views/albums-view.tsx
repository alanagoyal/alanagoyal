"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pause, Play } from "lucide-react";
import { useAudio } from "@/lib/music/audio-context";
import type { PlaylistTrack } from "../types";

interface Album {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  trackCount: number;
  tracks: PlaylistTrack[];
}

interface AlbumsViewProps {
  albums: Album[];
  isMobileView: boolean;
}

export function AlbumsView({ albums, isMobileView }: AlbumsViewProps) {
  const { playbackState, play, pause, resume } = useAudio();

  const handleAlbumPlay = (album: Album) => {
    const isCurrentAlbum =
      playbackState.currentTrack?.album === album.name &&
      playbackState.currentTrack.artist === album.artist;

    if (isCurrentAlbum && playbackState.isPlaying) {
      pause();
      return;
    }

    if (isCurrentAlbum) {
      resume();
      return;
    }

    const firstPlayableTrack = album.tracks.find((track) => track.previewUrl);
    if (firstPlayableTrack) {
      play(firstPlayableTrack, album.tracks);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className={cn("p-6", isMobileView && "p-4 pb-20")}>
        {!isMobileView && <h2 className="text-lg font-semibold mb-4">Albums</h2>}
        <div
          className={cn(
            "grid gap-4",
            isMobileView ? "grid-cols-2" : "grid-cols-3 desktop:grid-cols-5"
          )}
        >
          {albums.map((album) => {
            const isCurrentAlbum =
              playbackState.currentTrack?.album === album.name &&
              playbackState.currentTrack.artist === album.artist;
            const isPlayingAlbum = isCurrentAlbum && playbackState.isPlaying;
            const action = isPlayingAlbum ? "Pause" : isCurrentAlbum ? "Resume" : "Play";
            const hasPlayableTracks = album.tracks.some((track) => track.previewUrl);

            return (
              <div key={album.id} className="group min-w-0">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted shadow-md">
                  <Image
                    src={album.albumArt}
                    alt={album.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => handleAlbumPlay(album)}
                    disabled={!hasPlayableTracks}
                    aria-label={`${action} ${album.name} by ${album.artist}`}
                    className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/90 disabled:cursor-default",
                      isMobileView
                        ? "bg-black/5"
                        : "bg-black/0 can-hover:hover:bg-black/35 focus-visible:bg-black/35"
                    )}
                  >
                    {hasPlayableTracks && (
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg backdrop-blur-sm transition-opacity",
                          isPlayingAlbum ? "bg-red-500" : "bg-black/55",
                          isMobileView
                            ? "opacity-100"
                            : "opacity-0 can-hover:group-hover:opacity-100 group-focus-within:opacity-100"
                        )}
                      >
                        {isPlayingAlbum ? (
                          <Pause className="h-5 w-5 fill-current" aria-hidden />
                        ) : (
                          <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />
                        )}
                      </span>
                    )}
                  </button>
                </div>
                <p className="mt-2 truncate text-sm font-medium">{album.name}</p>
                <p className="truncate text-xs text-muted-foreground">{album.artist}</p>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
