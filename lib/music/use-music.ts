"use client";

import { useState } from "react";
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
  const [playlists] = useState<Playlist[]>(DEFAULT_PLAYLISTS);
  const [featuredPlaylist] = useState<Playlist>(getFeaturedPlaylist());
  const [albums] = useState(getAlbumsFromPlaylists());
  const [artists] = useState(getArtistsFromPlaylists());
  const [songs] = useState(getAllSongs());

  return {
    playlists,
    featuredPlaylist,
    albums,
    artists,
    songs,
  };
}
