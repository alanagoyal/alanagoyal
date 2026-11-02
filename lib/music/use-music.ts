"use client";

import { useMemo } from "react";
import { Playlist } from "@/components/apps/music/types";
import {
  DEFAULT_PLAYLISTS,
  getAlbumsFromPlaylists,
  getArtistsFromPlaylists,
  getAllSongs,
} from "@/components/apps/music/data";

interface UseMusicResult {
  playlists: Playlist[];
  albums: ReturnType<typeof getAlbumsFromPlaylists>;
  artists: ReturnType<typeof getArtistsFromPlaylists>;
  songs: ReturnType<typeof getAllSongs>;
}

export function useMusic(): UseMusicResult {
  const playlists = useMemo(() => DEFAULT_PLAYLISTS, []);
  const albums = useMemo(() => getAlbumsFromPlaylists(), []);
  const artists = useMemo(() => getArtistsFromPlaylists(), []);
  const songs = useMemo(() => getAllSongs(), []);

  return {
    playlists,
    albums,
    artists,
    songs,
  };
}
