// Spotify API types
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
  genres?: string[];
  external_urls?: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  artists: SpotifyArtist[];
  release_date: string;
  total_tracks: number;
  external_urls?: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  external_urls?: {
    spotify: string;
  };
  is_playable?: boolean;
}

// App-specific types
export interface NowPlaying {
  isPlaying: boolean;
  track: SpotifyTrack | null;
  progress_ms: number;
  timestamp: number;
}

export interface RecentlyPlayedItem {
  track: SpotifyTrack;
  played_at: string;
}

export interface RecentlyPlayed {
  items: RecentlyPlayedItem[];
}

export interface TopArtists {
  items: SpotifyArtist[];
}

export interface TopTracks {
  items: SpotifyTrack[];
}

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
  queueIndex: number;
  progress: number; // 0-1
  volume: number; // 0-1
  isShuffle: boolean;
  repeatMode: RepeatMode;
  duration: number; // in seconds
}
