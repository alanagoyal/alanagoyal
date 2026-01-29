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
import { useSystemSettings } from "@/lib/system-settings-context";

interface AudioContextValue {
  // State
  playbackState: PlaybackState;
  // Actions
  play: (track: PlaylistTrack, queue?: PlaylistTrack[]) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seek: (progress: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setQueue: (tracks: PlaylistTrack[], startIndex?: number) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

const STORAGE_KEY = "music-playback-state";

function loadStoredState(): Partial<PlaybackState> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        volume: parsed.volume ?? 0.7,
        isShuffle: parsed.isShuffle ?? false,
        repeatMode: parsed.repeatMode ?? "off",
      };
    }
  } catch {
    // Ignore
  }
  return {};
}

function saveState(state: Partial<PlaybackState>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        volume: state.volume,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode,
      })
    );
  } catch {
    // Ignore
  }
}

const defaultState: PlaybackState = {
  isPlaying: false,
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  progress: 0,
  volume: 0.7,
  isShuffle: false,
  repeatMode: "off",
  duration: 0,
};

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { volume: systemVolume } = useSystemSettings();
  const [playbackState, setPlaybackState] = useState<PlaybackState>(() => ({
    ...defaultState,
    ...loadStoredState(),
  }));

  // Create audio element on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      const audio = new Audio();
      audio.volume = (systemVolume / 100) * playbackState.volume;

      // Update duration when audio metadata loads (gets actual preview duration)
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && isFinite(audio.duration)) {
          setPlaybackState((prev) => ({ ...prev, duration: audio.duration }));
        }
      });

      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update audio volume when state or system volume changes
  // Effective volume = system volume (0-100) * app volume (0-1)
  useEffect(() => {
    if (audioRef.current) {
      const effectiveVolume = (systemVolume / 100) * playbackState.volume;
      audioRef.current.volume = effectiveVolume;
    }
  }, [playbackState.volume, systemVolume]);

  // Save settings to localStorage
  useEffect(() => {
    saveState({
      volume: playbackState.volume,
      isShuffle: playbackState.isShuffle,
      repeatMode: playbackState.repeatMode,
    });
  }, [playbackState.volume, playbackState.isShuffle, playbackState.repeatMode]);

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
      const { repeatMode, queue, queueIndex } = playbackState;

      if (repeatMode === "one") {
        // Repeat current track
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      // Try to play next track
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
                      }));
        } else {
          // Skip tracks without preview
          setPlaybackState((prev) => ({
            ...prev,
            queueIndex: nextIndex,
          }));
        }
      } else if (repeatMode === "all" && queue.length > 0) {
        // Restart queue
        const firstTrack = queue[0];
        if (firstTrack.previewUrl) {
          audio.src = firstTrack.previewUrl;
          audio.play().catch(() => {});
          setPlaybackState((prev) => ({
            ...prev,
            currentTrack: firstTrack,
            queueIndex: 0,
            progress: 0,
                      }));
        }
      } else {
        // Stop playing
        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: false,
          progress: 0,
        }));
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [playbackState.repeatMode, playbackState.queue, playbackState.queueIndex]);

  const play = useCallback((track: PlaylistTrack, queue?: PlaylistTrack[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!track.previewUrl) {
      console.warn("No preview URL for track:", track.name);
      return;
    }

    const newQueue = queue || [track];
    const queueIndex = queue ? queue.findIndex((t) => t.id === track.id) : 0;

    audio.src = track.previewUrl;
    audio.play().catch(console.error);

    setPlaybackState((prev) => ({
      ...prev,
      isPlaying: true,
      currentTrack: track,
      queue: newQueue,
      queueIndex: queueIndex >= 0 ? queueIndex : 0,
      progress: 0,
    }));
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
      setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
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
        queueIndex: -1,
      }));
    }
  }, []);

  const next = useCallback(() => {
    const { queue, queueIndex, repeatMode, isShuffle } = playbackState;
    if (queue.length === 0) return;

    let nextIndex: number;

    if (isShuffle) {
      // Pick random track that's not the current one
      const availableIndices = queue
        .map((_, i) => i)
        .filter((i) => i !== queueIndex);
      if (availableIndices.length === 0) {
        nextIndex = queueIndex;
      } else {
        nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      }
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === "all") {
          nextIndex = 0;
        } else {
          return; // End of queue
        }
      }
    }

    const nextTrack = queue[nextIndex];
    if (nextTrack && nextTrack.previewUrl && audioRef.current) {
      audioRef.current.src = nextTrack.previewUrl;
      audioRef.current.play().catch(console.error);
      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: true,
        currentTrack: nextTrack,
        queueIndex: nextIndex,
        progress: 0,
              }));
    }
  }, [playbackState]);

  const previous = useCallback(() => {
    const { queue, queueIndex } = playbackState;
    const audio = audioRef.current;
    if (!audio || queue.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setPlaybackState((prev) => ({ ...prev, progress: 0 }));
      return;
    }

    // Otherwise go to previous track
    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      const prevTrack = queue[prevIndex];
      if (prevTrack && prevTrack.previewUrl) {
        audio.src = prevTrack.previewUrl;
        audio.play().catch(console.error);
        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: true,
          currentTrack: prevTrack,
          queueIndex: prevIndex,
          progress: 0,
                  }));
      }
    }
  }, [playbackState]);

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

  const toggleShuffle = useCallback(() => {
    setPlaybackState((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setPlaybackState((prev) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const currentIndex = modes.indexOf(prev.repeatMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  const setQueue = useCallback(
    (tracks: PlaylistTrack[], startIndex = 0) => {
      if (tracks.length === 0) return;

      const shuffledTracks = playbackState.isShuffle
        ? [...tracks].sort(() => Math.random() - 0.5)
        : tracks;

      setPlaybackState((prev) => ({
        ...prev,
        queue: shuffledTracks,
        queueIndex: startIndex,
      }));
    },
    [playbackState.isShuffle]
  );

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
        setQueue,
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
