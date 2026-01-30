"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Playlist, PlaylistTrack } from "../types";
import { useAudio } from "@/lib/music/audio-context";
import { Play, Pause } from "lucide-react";
import { formatDuration } from "@/lib/music/utils";

interface HomeViewProps {
  featuredPlaylist: Playlist;
  playlists: Playlist[];
  onPlaylistSelect: (playlistId: string) => void;
  isMobileView: boolean;
}

export function HomeView({
  featuredPlaylist,
  playlists,
  onPlaylistSelect,
  isMobileView,
}: HomeViewProps) {
  const { playbackState, play, pause, resume } = useAudio();

  const handlePlayFeatured = () => {
    if (featuredPlaylist.tracks.length === 0) return;

    const currentlyPlayingFeatured =
      playbackState.currentTrack &&
      featuredPlaylist.tracks.some((t) => t.id === playbackState.currentTrack?.id);

    if (currentlyPlayingFeatured && playbackState.isPlaying) {
      pause();
    } else if (currentlyPlayingFeatured) {
      resume();
    } else {
      const firstPlayable = featuredPlaylist.tracks.find((t) => t.previewUrl);
      if (firstPlayable) {
        play(firstPlayable, featuredPlaylist.tracks);
      }
    }
  };

  const handleTrackPlay = (track: PlaylistTrack, playlist: Playlist) => {
    if (playbackState.currentTrack?.id === track.id && playbackState.isPlaying) {
      pause();
    } else if (playbackState.currentTrack?.id === track.id) {
      resume();
    } else {
      play(track, playlist.tracks);
    }
  };

  const isPlayingFeatured =
    playbackState.isPlaying &&
    playbackState.currentTrack &&
    featuredPlaylist.tracks.some((t) => t.id === playbackState.currentTrack?.id);

  const handlePlayPlaylist = (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    const isPlayingThisPlaylist =
      playbackState.isPlaying &&
      playbackState.currentTrack &&
      playlist.tracks.some((t) => t.id === playbackState.currentTrack?.id);

    if (isPlayingThisPlaylist) {
      pause();
    } else {
      onPlaylistSelect(playlist.id);
      const firstPlayable = playlist.tracks.find((t) => t.previewUrl);
      if (firstPlayable) {
        play(firstPlayable, playlist.tracks);
      }
    }
  };

  return (
    <ScrollArea className="h-full" bottomMargin="0">
      <div className={cn("p-6 pb-20", isMobileView && "p-4 pb-20")}>
        {/* Featured Playlist Hero */}
        <div className="mb-8">
          <div
            className={cn(
              "relative rounded-xl overflow-hidden bg-gradient-to-br from-red-500 to-pink-600",
              isMobileView ? "h-48" : "h-64"
            )}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-xs uppercase tracking-wider text-white/80 mb-1">
                Featured Playlist
              </p>
              <h1 className="text-2xl font-bold text-white mb-1">
                {featuredPlaylist.name}
              </h1>
              {featuredPlaylist.description && (
                <p className="text-sm text-white/80 mb-4">
                  {featuredPlaylist.description}
                </p>
              )}
              <button
                onClick={handlePlayFeatured}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition-transform"
              >
                {isPlayingFeatured ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Your Playlists */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Your Playlists</h2>
          <div
            className={cn(
              "grid gap-4",
              isMobileView ? "grid-cols-2" : "grid-cols-3 lg:grid-cols-5"
            )}
          >
            {playlists.map((playlist) => {
              const isPlaying =
                playbackState.isPlaying &&
                playbackState.currentTrack &&
                playlist.tracks.some((t) => t.id === playbackState.currentTrack?.id);

              return (
                <div
                  key={playlist.id}
                  onClick={() => onPlaylistSelect(playlist.id)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                    {playlist.tracks[0]?.albumArt ? (
                      <Image
                        src={playlist.tracks[0].albumArt}
                        alt={playlist.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800" />
                    )}
                    <div
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center"
                      onClick={(e) => handlePlayPlaylist(playlist, e)}
                    >
                      {isPlaying ? (
                        <Pause className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium truncate">{playlist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {playlist.tracks.length} songs
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Featured Playlist Tracks Preview */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {featuredPlaylist.name} - Tracks
          </h2>
          <div className="space-y-1">
            {featuredPlaylist.tracks.slice(0, 5).map((track, index) => {
              const isCurrentTrack = playbackState.currentTrack?.id === track.id;
              const isPlaying = isCurrentTrack && playbackState.isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackPlay(track, featuredPlaylist)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors overflow-hidden",
                    isCurrentTrack
                      ? "bg-red-500/10"
                      : "hover:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "w-5 text-center text-sm",
                      isCurrentTrack ? "text-red-500" : "text-muted-foreground"
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 mx-auto" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={track.albumArt}
                      alt={track.album}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="w-0 flex-grow overflow-hidden">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isCurrentTrack && "text-red-500"
                      )}
                    >
                      {track.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artist}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
