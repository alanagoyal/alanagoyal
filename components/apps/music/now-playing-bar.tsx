"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
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
import type { PlaylistTrack } from "./types";

interface NowPlayingBarProps {
  isMobileView: boolean;
}

type DropPosition = "before" | "after";

export function NowPlayingBar({ isMobileView }: NowPlayingBarProps) {
  const {
    playbackState,
    pause,
    resume,
    next,
    previous,
    seek,
    setVolume,
    reorderQueue,
    toggleShuffle,
    toggleRepeat,
    play,
  } = useAudio();
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    trackId: string;
    position: DropPosition;
  } | null>(null);
  const queuePanelRef = useRef<HTMLDivElement>(null);
  const mouseDragTrackIdRef = useRef<string | null>(null);
  const suppressNextPlayRef = useRef(false);
  const closeQueue = useCallback(() => setIsQueueOpen(false), []);

  const { currentTrack, isPlaying, progress, volume, isShuffle, repeatMode, duration, queue, queueIndex } =
    playbackState;

  useClickOutside(queuePanelRef, closeQueue, isQueueOpen);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      if (!mouseDragTrackIdRef.current) return;

      mouseDragTrackIdRef.current = null;
      setDraggedTrackId(null);
      setDropTarget(null);
      requestAnimationFrame(() => {
        suppressNextPlayRef.current = false;
      });
    };

    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => window.removeEventListener("mouseup", handleWindowMouseUp);
  }, []);

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

  const handleDragStart = (trackId: string) => {
    suppressNextPlayRef.current = true;
    mouseDragTrackIdRef.current = trackId;
    setDraggedTrackId(trackId);
  };

  const handleDragOver = (
    trackId: string,
    position: DropPosition
  ) => {
    if (trackId === draggedTrackId) {
      setDropTarget(null);
      return;
    }

    setDropTarget({ trackId, position });
  };

  const moveTrack = (
    sourceTrackId: string,
    trackId: string,
    position: DropPosition
  ) => {
    if (sourceTrackId === trackId) return;

    const fromIndex = queue.findIndex((track) => track.id === sourceTrackId);
    const targetIndex = queue.findIndex((track) => track.id === trackId);
    if (fromIndex < 0 || targetIndex < 0) return;

    let toIndex = targetIndex + (position === "after" ? 1 : 0);
    if (fromIndex < toIndex) {
      toIndex -= 1;
    }

    reorderQueue(fromIndex, toIndex);
    setDropTarget(null);
  };

  const handleDrop = (trackId: string, position: DropPosition) => {
    if (!draggedTrackId) return;
    moveTrack(draggedTrackId, trackId, position);
    mouseDragTrackIdRef.current = null;
  };

  const handleMouseDrag = (
    trackId: string,
    position: DropPosition
  ) => {
    const sourceTrackId = mouseDragTrackIdRef.current;
    if (!sourceTrackId || sourceTrackId === trackId) return;

    suppressNextPlayRef.current = true;
    setDraggedTrackId(sourceTrackId);
    setDropTarget({ trackId, position });
  };

  const handleMouseDrop = (
    trackId: string,
    position: DropPosition
  ) => {
    const sourceTrackId = mouseDragTrackIdRef.current;
    if (sourceTrackId) {
      moveTrack(sourceTrackId, trackId, position);
    }
    handleDragEnd();
  };

  const handleDragEnd = () => {
    mouseDragTrackIdRef.current = null;
    setDraggedTrackId(null);
    setDropTarget(null);
    requestAnimationFrame(() => {
      suppressNextPlayRef.current = false;
    });
  };

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
                          isDragging={draggedTrackId === track.id}
                          dropPosition={
                            dropTarget?.trackId === track.id
                              ? dropTarget.position
                              : null
                          }
                          onPlay={() => {
                            if (!suppressNextPlayRef.current) {
                              play(track, queue);
                            }
                          }}
                          onDragStart={() => handleDragStart(track.id)}
                          onDragOver={(position) =>
                            handleDragOver(track.id, position)
                          }
                          onDrop={(position) =>
                            handleDrop(track.id, position)
                          }
                          onDragEnd={handleDragEnd}
                          onMouseDown={() => {
                            mouseDragTrackIdRef.current = track.id;
                          }}
                          onMouseDrag={(position) =>
                            handleMouseDrag(track.id, position)
                          }
                          onMouseDrop={(position) =>
                            handleMouseDrop(track.id, position)
                          }
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
  isDragging = false,
  dropPosition = null,
  onPlay,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMouseDown,
  onMouseDrag,
  onMouseDrop,
}: {
  track: PlaylistTrack;
  isCurrent?: boolean;
  isDragging?: boolean;
  dropPosition?: DropPosition | null;
  onPlay?: () => void;
  onDragStart?: () => void;
  onDragOver?: (position: DropPosition) => void;
  onDrop?: (position: DropPosition) => void;
  onDragEnd?: () => void;
  onMouseDown?: () => void;
  onMouseDrag?: (position: DropPosition) => void;
  onMouseDrop?: (position: DropPosition) => void;
}) {
  const getDropPosition = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientY < bounds.top + bounds.height / 2
      ? "before"
      : "after";
  };

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
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", track.id);
        onDragStart?.();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        const bounds = event.currentTarget.getBoundingClientRect();
        const position =
          event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
        onDragOver?.(position);
      }}
      onDrop={(event) => {
        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        const position =
          event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
        onDrop?.(position);
      }}
      onDragEnd={onDragEnd}
      onMouseDown={onMouseDown}
      onMouseMove={(event) => {
        if (event.buttons === 1) {
          onMouseDrag?.(getDropPosition(event));
        }
      }}
      onMouseUp={(event) => onMouseDrop?.(getDropPosition(event))}
      className={cn(
        "relative flex w-full select-none items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-[background-color,opacity] can-hover:cursor-grab can-hover:hover:bg-muted can-hover:active:cursor-grabbing",
        isDragging && "opacity-35"
      )}
      aria-label={`Play ${track.name} by ${track.artist}`}
      title="Drag to reorder"
    >
      {dropPosition && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-2 right-2 h-0.5 rounded-full bg-red-500",
            dropPosition === "before" ? "-top-px" : "-bottom-px"
          )}
        />
      )}
      {content}
    </button>
  );
}
