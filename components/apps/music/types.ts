// Playlist types (for hardcoded data)
export interface PlaylistTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  previewUrl: string | null;
  duration: number; // in seconds
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverArt: string;
  tracks: PlaylistTrack[];
  is_featured?: boolean;
}

// View types
export type MusicView =
  | "home"
  | "recently-added"
  | "artists"
  | "albums"
  | "songs"
  | "playlist";

// Playback state
export type RepeatMode = "off" | "all" | "one";

export interface PlaybackState {
  isPlaying: boolean;
  currentTrack: PlaylistTrack | null;
  queue: PlaylistTrack[];
  originalQueue: PlaylistTrack[]; // Original order before shuffle
  queueIndex: number;
  progress: number; // 0-1
  volume: number; // 0-1
  isShuffle: boolean;
  repeatMode: RepeatMode;
  duration: number; // in seconds
  error: string | null; // Playback error message
}
