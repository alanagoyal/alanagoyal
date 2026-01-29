"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Playlist, PlaylistTrack } from "../types";
import { useAudio } from "@/lib/music/audio-context";
import { Play, Pause, Shuffle } from "lucide-react";

interface PlaylistViewProps {
  playlist: Playlist;
  isMobileView: boolean;
}

export function PlaylistView({ playlist, isMobileView }: PlaylistViewProps) {
  const { playbackState, play, pause, resume, toggleShuffle } = useAudio();

  const handleTrackPlay = (track: PlaylistTrack) => {
    if (playbackState.currentTrack?.id === track.id && playbackState.isPlaying) {
      pause();
    } else if (playbackState.currentTrack?.id === track.id) {
      resume();
    } else {
      play(track, playlist.tracks);
    }
  };

  const handlePlayAll = () => {
    const firstPlayable = playlist.tracks.find((t) => t.previewUrl);
    if (firstPlayable) {
      play(firstPlayable, playlist.tracks);
    }
  };

  const isPlayingPlaylist =
    playbackState.isPlaying &&
    playbackState.currentTrack &&
    playlist.tracks.some((t) => t.id === playbackState.currentTrack?.id);

  const totalDuration = playlist.tracks.reduce((sum, t) => sum + t.duration, 0);

  return (
    <ScrollArea className="h-full" bottomMargin="0">
      <div className={cn("p-6", isMobileView && "p-4")}>
        {/* Playlist Header */}
        <div
          className={cn(
            "flex gap-6 mb-6",
            isMobileView && "flex-col items-center text-center"
          )}
        >
          <div
            className={cn(
              "relative flex-shrink-0 rounded-lg overflow-hidden shadow-xl bg-muted",
              isMobileView ? "w-48 h-48" : "w-56 h-56"
            )}
          >
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
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Playlist
            </p>
            <h1 className="text-2xl font-bold mb-2">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {playlist.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {playlist.tracks.length} songs, {formatTotalDuration(totalDuration)}
            </p>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                {isPlayingPlaylist ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play
                  </>
                )}
              </button>
              <button
                onClick={toggleShuffle}
                className={cn(
                  "p-2.5 rounded-full transition-colors",
                  playbackState.isShuffle
                    ? "bg-red-500 text-white"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div>
          {/* Header row for desktop */}
          {!isMobileView && (
            <div className="flex items-center gap-3 px-2 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
              <span className="w-5 text-center">#</span>
              <span className="w-10" /> {/* Album art space */}
              <span className="flex-1">Title</span>
              <span className="w-[150px]">Album</span>
              <span className="w-12 text-right">Time</span>
            </div>
          )}

          <div className="space-y-1 mt-1">
            {playlist.tracks.map((track, index) => {
              const isCurrentTrack = playbackState.currentTrack?.id === track.id;
              const isPlaying = isCurrentTrack && playbackState.isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackPlay(track)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group",
                    isCurrentTrack ? "bg-red-500/10" : "hover:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "w-5 text-center text-sm",
                      isCurrentTrack ? "text-red-500" : "text-muted-foreground"
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 mx-auto" />
                    ) : (
                      <span className="group-hover:hidden">{index + 1}</span>
                    )}
                    {!isPlaying && (
                      <Play className="w-4 h-4 mx-auto hidden group-hover:block" />
                    )}
                  </span>
                  <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={track.albumArt}
                      alt={track.album}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isCurrentTrack && "text-red-500"
                      )}
                    >
                      {track.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artist}
                    </p>
                  </div>
                  {!isMobileView && (
                    <span className="text-xs text-muted-foreground truncate w-[150px]">
                      {track.album}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} hr ${mins} min`;
  }
  return `${mins} min`;
}
