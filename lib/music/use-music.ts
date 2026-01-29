"use client";

import { useState, useEffect, useCallback } from "react";
import {
  NowPlaying,
  RecentlyPlayed,
  TopArtists,
  TopTracks,
  Playlist,
} from "@/components/apps/music/types";
import {
  DEFAULT_PLAYLISTS,
  getAlbumsFromPlaylists,
  getArtistsFromPlaylists,
  getAllSongs,
  getFeaturedPlaylist,
} from "@/components/apps/music/data";

interface UseMusicResult {
  // Spotify data
  nowPlaying: NowPlaying | null;
  recentlyPlayed: RecentlyPlayed | null;
  topArtists: TopArtists | null;
  topTracks: TopTracks | null;
  // Local data
  playlists: Playlist[];
  featuredPlaylist: Playlist;
  albums: ReturnType<typeof getAlbumsFromPlaylists>;
  artists: ReturnType<typeof getArtistsFromPlaylists>;
  songs: ReturnType<typeof getAllSongs>;
  // State
  loading: boolean;
  error: string | null;
  // Actions
  refetch: () => void;
}

const POLL_INTERVAL = 15000; // 15 seconds for now-playing

export function useMusic(): UseMusicResult {
  // Spotify data
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayed | null>(null);
  const [topArtists, setTopArtists] = useState<TopArtists | null>(null);
  const [topTracks, setTopTracks] = useState<TopTracks | null>(null);

  // Local data (static)
  const [playlists] = useState<Playlist[]>(DEFAULT_PLAYLISTS);
  const [featuredPlaylist] = useState<Playlist>(getFeaturedPlaylist());
  const [albums] = useState(getAlbumsFromPlaylists());
  const [artists] = useState(getArtistsFromPlaylists());
  const [songs] = useState(getAllSongs());

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch("/api/music/now-playing");
      if (res.ok) {
        const data = await res.json();
        setNowPlaying(data);
      }
    } catch (err) {
      console.error("Failed to fetch now playing:", err);
    }
  }, []);

  const fetchRecentlyPlayed = useCallback(async () => {
    try {
      const res = await fetch("/api/music/recently-played?limit=10");
      if (res.ok) {
        const data = await res.json();
        setRecentlyPlayed(data);
      }
    } catch (err) {
      console.error("Failed to fetch recently played:", err);
    }
  }, []);

  const fetchTopArtists = useCallback(async () => {
    try {
      const res = await fetch("/api/music/top?type=artists&limit=12");
      if (res.ok) {
        const data = await res.json();
        setTopArtists(data);
      }
    } catch (err) {
      console.error("Failed to fetch top artists:", err);
    }
  }, []);

  const fetchTopTracks = useCallback(async () => {
    try {
      const res = await fetch("/api/music/top?type=tracks&limit=10");
      if (res.ok) {
        const data = await res.json();
        setTopTracks(data);
      }
    } catch (err) {
      console.error("Failed to fetch top tracks:", err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchNowPlaying(),
        fetchRecentlyPlayed(),
        fetchTopArtists(),
        fetchTopTracks(),
      ]);
    } catch (err) {
      setError("Failed to fetch music data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchNowPlaying, fetchRecentlyPlayed, fetchTopArtists, fetchTopTracks]);

  // Initial fetch
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Poll now-playing
  useEffect(() => {
    const interval = setInterval(fetchNowPlaying, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  return {
    nowPlaying,
    recentlyPlayed,
    topArtists,
    topTracks,
    playlists,
    featuredPlaylist,
    albums,
    artists,
    songs,
    loading,
    error,
    refetch: fetchAll,
  };
}
