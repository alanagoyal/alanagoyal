import {
  NowPlaying,
  RecentlyPlayed,
  TopArtists,
  TopTracks,
  SpotifyTrack,
  SpotifyArtist,
} from "@/components/apps/music/types";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Cache for access token
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get a fresh access token using the refresh token
 */
export async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing Spotify credentials");
    return null;
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh token:", response.status);
      return null;
    }

    const data = await response.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return cachedToken.token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

/**
 * Make an authenticated request to the Spotify API
 */
async function spotifyFetch<T>(endpoint: string): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 204) {
        return null; // No content (e.g., nothing playing)
      }
      console.error(`Spotify API error: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Spotify fetch error:", error);
    return null;
  }
}

/**
 * Get the currently playing track
 */
export async function getNowPlaying(): Promise<NowPlaying> {
  const data = await spotifyFetch<{
    is_playing: boolean;
    item: SpotifyTrack | null;
    progress_ms: number;
    timestamp: number;
  }>("/me/player/currently-playing");

  if (!data) {
    return {
      isPlaying: false,
      track: null,
      progress_ms: 0,
      timestamp: Date.now(),
    };
  }

  return {
    isPlaying: data.is_playing,
    track: data.item,
    progress_ms: data.progress_ms,
    timestamp: data.timestamp,
  };
}

/**
 * Get recently played tracks
 */
export async function getRecentlyPlayed(limit = 20): Promise<RecentlyPlayed> {
  const data = await spotifyFetch<{
    items: Array<{ track: SpotifyTrack; played_at: string }>;
  }>(`/me/player/recently-played?limit=${limit}`);

  if (!data) {
    return { items: [] };
  }

  return {
    items: data.items.map((item) => ({
      track: item.track,
      played_at: item.played_at,
    })),
  };
}

/**
 * Get user's top artists
 */
export async function getTopArtists(
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit = 20
): Promise<TopArtists> {
  const data = await spotifyFetch<{ items: SpotifyArtist[] }>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`
  );

  if (!data) {
    return { items: [] };
  }

  return { items: data.items };
}

/**
 * Get user's top tracks
 */
export async function getTopTracks(
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit = 20
): Promise<TopTracks> {
  const data = await spotifyFetch<{ items: SpotifyTrack[] }>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
  );

  if (!data) {
    return { items: [] };
  }

  return { items: data.items };
}
