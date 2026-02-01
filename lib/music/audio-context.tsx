"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { PlaylistTrack, RepeatMode, PlaybackState } from "@/components/apps/music/types";
import { useSystemSettingsSafe } from "@/lib/system-settings-context";

interface AudioContextValue {
  playbackState: PlaybackState;
  play: (track: PlaylistTrack, queue: PlaylistTrack[]) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seek: (progress: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

const STORAGE_KEY = "music-playback-state";

// Persist playback state including queue for next/previous to work after refresh
interface PersistedState {
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  currentTrack: PlaylistTrack | null;
  progress: number;
  queue: PlaylistTrack[];
  originalQueue: PlaylistTrack[];
  queueIndex: number;
}

function loadStoredState(): Partial<PlaybackState> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: PersistedState = JSON.parse(stored);
      return {
        volume: parsed.volume ?? 0.7,
        isShuffle: parsed.isShuffle ?? false,
        repeatMode: parsed.repeatMode ?? "off",
        currentTrack: parsed.currentTrack ?? null,
        progress: parsed.progress ?? 0,
        queue: parsed.queue ?? [],
        originalQueue: parsed.originalQueue ?? [],
        queueIndex: parsed.queueIndex ?? -1,
      };
    }
  } catch {
    // Ignore
  }
  return {};
}

function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore - quota exceeded or private browsing
  }
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const defaultState: PlaybackState = {
  isPlaying: false,
  currentTrack: null,
  queue: [],
  originalQueue: [],
  queueIndex: -1,
  progress: 0,
  volume: 0.7,
  isShuffle: false,
  repeatMode: "off",
  duration: 0,
  error: null,
};

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { volume: systemVolume } = useSystemSettingsSafe();
  const [playbackState, setPlaybackState] = useState<PlaybackState>(() => ({
    ...defaultState,
    ...loadStoredState(),
  }));

  // Keep a ref to the latest state for callbacks that need fresh values
  const stateRef = useRef(playbackState);
  stateRef.current = playbackState;

  // Debounced save - only saves after 1 second of no changes
  const debouncedSave = useCallback((state: PlaybackState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveState({
        volume: state.volume,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode,
        currentTrack: state.currentTrack,
        progress: state.progress,
        queue: state.queue,
        originalQueue: state.originalQueue,
        queueIndex: state.queueIndex,
      });
    }, 1000);
  }, []);

  // Immediate save for important changes (track change, settings)
  const immediateSave = useCallback((state: PlaybackState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveState({
      volume: state.volume,
      isShuffle: state.isShuffle,
      repeatMode: state.repeatMode,
      currentTrack: state.currentTrack,
      progress: state.progress,
      queue: state.queue,
      originalQueue: state.originalQueue,
      queueIndex: state.queueIndex,
    });
  }, []);

  // Create audio element on mount and restore track if available
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      const audio = new Audio();
      audio.volume = (systemVolume / 100) * playbackState.volume;

      // Handle metadata load - update duration and seek to saved progress
      const handleLoadedMetadata = () => {
        if (audio.duration && isFinite(audio.duration)) {
          // Seek to saved progress on initial load (side effect outside setState)
          const state = stateRef.current;
          if (state.progress > 0 && !state.isPlaying) {
            audio.currentTime = state.progress * audio.duration;
          }
          setPlaybackState((prev) => ({ ...prev, duration: audio.duration }));
        }
      };

      // Handle playback errors
      const handleError = () => {
        const errorMessage = audio.error?.message || "Failed to load audio";
        console.error("Audio error:", errorMessage);
        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: false,
          error: errorMessage,
        }));
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("error", handleError);

      // Restore track from persisted state (but don't auto-play)
      if (playbackState.currentTrack?.previewUrl) {
        audio.src = playbackState.currentTrack.previewUrl;
      }

      audioRef.current = audio;

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("error", handleError);
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Update audio volume when state or system volume changes
  useEffect(() => {
    if (audioRef.current) {
      const effectiveVolume = (systemVolume / 100) * playbackState.volume;
      audioRef.current.volume = effectiveVolume;
    }
  }, [playbackState.volume, systemVolume]);

  // Debounced save for progress updates
  useEffect(() => {
    debouncedSave(playbackState);
  }, [playbackState.progress, debouncedSave, playbackState]);

  // Immediate save for important state changes
  const prevTrackRef = useRef(playbackState.currentTrack?.id);
  const prevVolumeRef = useRef(playbackState.volume);
  const prevShuffleRef = useRef(playbackState.isShuffle);
  const prevRepeatRef = useRef(playbackState.repeatMode);

  useEffect(() => {
    const trackChanged = prevTrackRef.current !== playbackState.currentTrack?.id;
    const volumeChanged = prevVolumeRef.current !== playbackState.volume;
    const shuffleChanged = prevShuffleRef.current !== playbackState.isShuffle;
    const repeatChanged = prevRepeatRef.current !== playbackState.repeatMode;

    if (trackChanged || volumeChanged || shuffleChanged || repeatChanged) {
      immediateSave(playbackState);
      prevTrackRef.current = playbackState.currentTrack?.id;
      prevVolumeRef.current = playbackState.volume;
      prevShuffleRef.current = playbackState.isShuffle;
      prevRepeatRef.current = playbackState.repeatMode;
    }
  }, [
    playbackState.currentTrack?.id,
    playbackState.volume,
    playbackState.isShuffle,
    playbackState.repeatMode,
    immediateSave,
    playbackState,
  ]);

  // Progress update interval
  useEffect(() => {
    if (!playbackState.isPlaying || !audioRef.current) return;

    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        const progress =
          audioRef.current.duration > 0
            ? audioRef.current.currentTime / audioRef.current.duration
            : 0;
        setPlaybackState((prev) => ({ ...prev, progress }));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [playbackState.isPlaying]);

  // Handle track ending
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      const { repeatMode, queue, queueIndex } = stateRef.current;

      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      const nextIndex = queueIndex + 1;
      if (nextIndex < queue.length) {
        const nextTrack = queue[nextIndex];
        if (nextTrack.previewUrl) {
          audio.src = nextTrack.previewUrl;
          audio.play().catch(() => {});
          setPlaybackState((prev) => ({
            ...prev,
            currentTrack: nextTrack,
            queueIndex: nextIndex,
            progress: 0,
            error: null,
          }));
        } else {
          setPlaybackState((prev) => ({
            ...prev,
            queueIndex: nextIndex,
          }));
        }
      } else if (repeatMode === "all" && queue.length > 0) {
        const firstTrack = queue[0];
        if (firstTrack.previewUrl) {
          audio.src = firstTrack.previewUrl;
          audio.play().catch(() => {});
          setPlaybackState((prev) => ({
            ...prev,
            currentTrack: firstTrack,
            queueIndex: 0,
            progress: 0,
            error: null,
          }));
        }
      } else {
        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: false,
          progress: 0,
        }));
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  // Play a track
  const play = useCallback((track: PlaylistTrack, tracks: PlaylistTrack[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!track.previewUrl) {
      console.warn("No preview URL for track:", track.name);
      return;
    }

    audio.src = track.previewUrl;
    audio.play().catch(console.error);

    setPlaybackState((prev) => {
      // If shuffle is on, create shuffled queue with selected track first
      let queue: PlaylistTrack[];
      let queueIndex: number;

      if (prev.isShuffle) {
        const otherTracks = tracks.filter((t) => t.id !== track.id);
        queue = [track, ...shuffleArray(otherTracks)];
        queueIndex = 0;
      } else {
        queue = tracks;
        queueIndex = tracks.findIndex((t) => t.id === track.id);
        if (queueIndex < 0) queueIndex = 0;
      }

      return {
        ...prev,
        isPlaying: true,
        currentTrack: track,
        queue,
        originalQueue: tracks,
        queueIndex,
        progress: 0,
        error: null,
      };
    });
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && playbackState.currentTrack) {
      audioRef.current.play().catch(console.error);
      setPlaybackState((prev) => ({ ...prev, isPlaying: true, error: null }));
    }
  }, [playbackState.currentTrack]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTrack: null,
        progress: 0,
        queue: [],
        originalQueue: [],
        queueIndex: -1,
        error: null,
      }));
    }
  }, []);

  const next = useCallback(() => {
    const { queue, queueIndex, repeatMode, isPlaying } = stateRef.current;
    if (queue.length === 0) return;

    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeatMode === "all") {
        nextIndex = 0;
      } else {
        return;
      }
    }

    const nextTrack = queue[nextIndex];
    if (nextTrack && nextTrack.previewUrl && audioRef.current) {
      audioRef.current.src = nextTrack.previewUrl;
      // Only auto-play if we were already playing
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
      setPlaybackState((prev) => ({
        ...prev,
        currentTrack: nextTrack,
        queueIndex: nextIndex,
        progress: 0,
        error: null,
      }));
    }
  }, []);

  const previous = useCallback(() => {
    const { queue, queueIndex, isPlaying } = stateRef.current;
    const audio = audioRef.current;
    if (!audio || queue.length === 0) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setPlaybackState((prev) => ({ ...prev, progress: 0 }));
      return;
    }

    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      const prevTrack = queue[prevIndex];
      if (prevTrack && prevTrack.previewUrl) {
        audio.src = prevTrack.previewUrl;
        // Only auto-play if we were already playing
        if (isPlaying) {
          audio.play().catch(console.error);
        }
        setPlaybackState((prev) => ({
          ...prev,
          currentTrack: prevTrack,
          queueIndex: prevIndex,
          progress: 0,
          error: null,
        }));
      }
    }
  }, []);

  const seek = useCallback((progress: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = progress * audio.duration;
      setPlaybackState((prev) => ({ ...prev, progress }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = (systemVolume / 100) * clampedVolume;
    }
    setPlaybackState((prev) => ({ ...prev, volume: clampedVolume }));
  }, [systemVolume]);

  // Toggle shuffle mode
  const toggleShuffle = useCallback(() => {
    setPlaybackState((prev) => {
      const newIsShuffle = !prev.isShuffle;
      const currentTrack = prev.currentTrack;

      // If we have an active queue, reshuffle or restore it
      if (prev.originalQueue.length > 0 && currentTrack) {
        let newQueue: PlaylistTrack[];
        let newQueueIndex: number;

        if (newIsShuffle) {
          // Turning shuffle ON: shuffle remaining tracks, keep current at front
          const otherTracks = prev.originalQueue.filter((t) => t.id !== currentTrack.id);
          newQueue = [currentTrack, ...shuffleArray(otherTracks)];
          newQueueIndex = 0;
        } else {
          // Turning shuffle OFF: restore original order
          newQueue = prev.originalQueue;
          newQueueIndex = prev.originalQueue.findIndex((t) => t.id === currentTrack.id);
          if (newQueueIndex < 0) newQueueIndex = 0;
        }

        return {
          ...prev,
          isShuffle: newIsShuffle,
          queue: newQueue,
          queueIndex: newQueueIndex,
        };
      }

      return { ...prev, isShuffle: newIsShuffle };
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setPlaybackState((prev) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const currentIndex = modes.indexOf(prev.repeatMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  return (
    <AudioContext.Provider
      value={{
        playbackState,
        play,
        pause,
        resume,
        stop,
        next,
        previous,
        seek,
        setVolume,
        toggleShuffle,
        toggleRepeat,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
