"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { useAudio } from "@/lib/music/audio-context";
import {
  ListMusic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/music/utils";

interface NowPlayingBarProps {
  isMobileView: boolean;
}

export function NowPlayingBar({ isMobileView }: NowPlayingBarProps) {
  const {
    playbackState,
    pause,
    resume,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    play,
  } = useAudio();
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const queuePanelRef = useRef<HTMLDivElement>(null);
  const closeQueue = useCallback(() => setIsQueueOpen(false), []);

  const { currentTrack, isPlaying, progress, volume, isShuffle, repeatMode, duration, queue, queueIndex } =
    playbackState;

  useClickOutside(queuePanelRef, closeQueue, isQueueOpen);

  // Don't render if nothing is playing
  if (!currentTrack) return null;

  // Disable navigation when there's only one track in the queue
  const canNavigate = queue.length > 1;
  const canGoPrevious = canNavigate && queueIndex > 0;
  const canGoNext = canNavigate && (queueIndex < queue.length - 1 || repeatMode === "all");
  const upcomingTracks = queue.slice(queueIndex + 1);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleVolumeToggle = () => {
    if (volume > 0) {
      setVolume(0);
    } else {
      setVolume(0.7);
    }
  };

  const currentTime = Math.floor(progress * duration);

  return (
    <div
      className={cn(
        "relative flex-shrink-0 border-t border-border bg-background/95 backdrop-blur-sm",
        isMobileView ? "h-16 px-3" : "h-20 px-4"
      )}
    >
      <div className="h-full flex items-center gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[200px]">
          <div
            className={cn(
              "relative flex-shrink-0 rounded overflow-hidden bg-muted",
              isMobileView ? "w-10 h-10" : "w-12 h-12"
            )}
          >
            <Image
              src={currentTrack.albumArt}
              alt={currentTrack.album}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{currentTrack.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {!isMobileView && (
              <button
                onClick={toggleShuffle}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isShuffle
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={isShuffle ? "Shuffle On" : "Shuffle Off"}
              >
                <Shuffle className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={previous}
              disabled={!canGoPrevious}
              className={cn(
                "p-2 rounded-full transition-colors",
                canGoPrevious
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/30 cursor-not-allowed"
              )}
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-2 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <button
              onClick={next}
              disabled={!canGoNext}
              className={cn(
                "p-2 rounded-full transition-colors",
                canGoNext
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/30 cursor-not-allowed"
              )}
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {!isMobileView && (
              <button
                onClick={toggleRepeat}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  repeatMode !== "off"
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {!isMobileView && (
            <div className="w-full max-w-md flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                {formatDuration(currentTime)}
              </span>
              <Slider
                value={[progress * 100]}
                max={100}
                step={0.1}
                onValueChange={([value]) => seek(value / 100)}
                className="flex-1 min-w-[100px]"
              />
              <span className="text-xs text-muted-foreground w-8 tabular-nums">
                {formatDuration(duration)}
              </span>
            </div>
          )}
        </div>

        {/* Volume and Queue Controls */}
        {!isMobileView && (
          <div className="flex items-center gap-1 w-[190px]">
            <button
              onClick={handleVolumeToggle}
              className="p-2 rounded-full text-muted-foreground transition-colors can-hover:hover:text-foreground"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={([value]) => setVolume(value / 100)}
              className="flex-1"
            />
            <div ref={queuePanelRef} className="relative">
              <button
                onClick={() => setIsQueueOpen((open) => !open)}
                className={cn(
                  "p-2 rounded-full transition-colors can-hover:hover:text-foreground",
                  isQueueOpen ? "text-red-500" : "text-muted-foreground"
                )}
                aria-label="Playing Next"
                aria-expanded={isQueueOpen}
                aria-controls="music-playing-next"
                title="Playing Next"
              >
                <ListMusic className="w-4 h-4" />
              </button>

              {isQueueOpen && (
                <div
                  id="music-playing-next"
                  role="region"
                  aria-label="Playing Next"
                  className="absolute bottom-[calc(100%+24px)] right-0 z-10 w-[320px] overflow-hidden rounded-xl border border-black/10 bg-white/95 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-800/95"
                >
                  <div className="border-b border-border/60 px-4 py-3">
                    <h2 className="text-sm font-semibold">Playing Next</h2>
                  </div>

                  <div className="max-h-[340px] overflow-y-auto p-2">
                    <p className="px-2 pb-1 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Now Playing
                    </p>
                    <QueueTrack
                      track={currentTrack}
                      isCurrent
                    />

                    <p className="px-2 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Next
                    </p>
                    {upcomingTracks.length > 0 ? (
                      upcomingTracks.map((track) => (
                        <QueueTrack
                          key={track.id}
                          track={track}
                          onPlay={() => play(track, queue)}
                        />
                      ))
                    ) : (
                      <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                        No songs queued
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QueueTrack({
  track,
  isCurrent = false,
  onPlay,
}: {
  track: {
    name: string;
    artist: string;
    albumArt: string;
  };
  isCurrent?: boolean;
  onPlay?: () => void;
}) {
  const content = (
    <>
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
        <Image
          src={track.albumArt}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", isCurrent && "text-red-500")}>
          {track.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
      </div>
      {isCurrent && (
        <span className="flex h-4 items-end gap-0.5" aria-label="Now playing">
          {[10, 16, 12].map((height, index) => (
            <span
              key={index}
              className="w-0.5 rounded-full bg-red-500"
              style={{ height }}
            />
          ))}
        </span>
      )}
    </>
  );

  if (!onPlay) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
        {content}
      </div>
    );
  }

  return (
    <button
      onClick={onPlay}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors can-hover:hover:bg-muted"
      aria-label={`Play ${track.name} by ${track.artist}`}
    >
      {content}
    </button>
  );
}
