"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaylistTrack } from "../types";
import { useAudio } from "@/lib/music/audio-context";
import { Play, Pause } from "lucide-react";
import { formatDuration } from "@/lib/music/utils";

interface RecentlyAddedViewProps {
  songs: PlaylistTrack[];
  isMobileView: boolean;
}

export function RecentlyAddedView({
  songs,
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

  return (
    <ScrollArea className="h-full" bottomMargin="0">
      <div className={cn("p-6 pb-20", isMobileView && "p-4 pb-20")}>
        <div>
          {/* Title only on desktop - mobile shows it in nav header */}
          {!isMobileView && (
            <h2 className="text-lg font-semibold mb-4">Recently Added</h2>
          )}

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
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group overflow-hidden",
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
                  <div className="w-0 flex-grow overflow-hidden">
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
                  <span className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">
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
