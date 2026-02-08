"use client";

import { useMemo } from "react";
import { Playlist } from "@/components/apps/music/types";
import {
  DEFAULT_PLAYLISTS,
  getAlbumsFromPlaylists,
  getArtistsFromPlaylists,
  getAllSongs,
  getFeaturedPlaylist,
} from "@/components/apps/music/data";

interface UseMusicResult {
  playlists: Playlist[];
  featuredPlaylist: Playlist;
  albums: ReturnType<typeof getAlbumsFromPlaylists>;
  artists: ReturnType<typeof getArtistsFromPlaylists>;
  songs: ReturnType<typeof getAllSongs>;
}

export function useMusic(): UseMusicResult {
  const playlists = useMemo(() => DEFAULT_PLAYLISTS, []);
  const featuredPlaylist = useMemo(() => getFeaturedPlaylist(), []);
  const albums = useMemo(() => getAlbumsFromPlaylists(), []);
  const artists = useMemo(() => getArtistsFromPlaylists(), []);
  const songs = useMemo(() => getAllSongs(), []);

  return {
    playlists,
    featuredPlaylist,
    albums,
    artists,
    songs,
  };
}
