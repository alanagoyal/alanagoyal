"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaylistTrack, RecentlyPlayed } from "../types";
import { useAudio } from "@/lib/music/audio-context";
import { Play, Pause } from "lucide-react";

interface RecentlyAddedViewProps {
  songs: PlaylistTrack[];
  recentlyPlayed: RecentlyPlayed | null;
  isMobileView: boolean;
}

export function RecentlyAddedView({
  songs,
  recentlyPlayed,
  isMobileView,
}: RecentlyAddedViewProps) {
  const { playbackState, play, pause, resume } = useAudio();

  const handleTrackPlay = (track: PlaylistTrack, queue: PlaylistTrack[]) => {
    if (playbackState.currentTrack?.id === track.id && playbackState.isPlaying) {
      pause();
    } else if (playbackState.currentTrack?.id === track.id) {
      resume();
    } else {
      play(track, queue);
    }
  };

  const spotifyRecent = recentlyPlayed?.items || [];

  return (
    <ScrollArea className="h-full" bottomMargin="0">
      <div className={cn("p-6", isMobileView && "p-4")}>
        {/* Recently Played from Spotify */}
        {spotifyRecent.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Recently Played on Spotify</h2>
            <div className="space-y-1">
              {spotifyRecent.map((item, index) => (
                <div
                  key={`${item.track.id}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  <span className="w-5 text-center text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    {item.track.album.images[0] && (
                      <Image
                        src={item.track.album.images[0].url}
                        alt={item.track.album.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.track.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                  {!isMobileView && (
                    <span className="text-xs text-muted-foreground">
                      {formatPlayedAt(item.played_at)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Library Songs as Recently Added */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recently Added</h2>

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
            {songs.map((track, index) => {
              const isCurrentTrack = playbackState.currentTrack?.id === track.id;
              const isPlaying = isCurrentTrack && playbackState.isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackPlay(track, songs)}
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

function formatPlayedAt(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}
