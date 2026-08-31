import type { PlaylistTrack } from "@/components/apps/music/types";

export const MUSIC_RECENTLY_PLAYED_STORAGE_KEY = "music-recently-played";

const MAX_RECENT_TRACKS = 8;

function isPlaylistTrack(value: unknown): value is PlaylistTrack {
  if (!value || typeof value !== "object") return false;

  const track = value as Record<string, unknown>;
  return (
    typeof track.id === "string" &&
    track.id.length > 0 &&
    typeof track.name === "string" &&
    typeof track.artist === "string" &&
    typeof track.album === "string" &&
    typeof track.albumArt === "string" &&
    (track.previewUrl === null || typeof track.previewUrl === "string") &&
    typeof track.duration === "number" &&
    Number.isFinite(track.duration) &&
    track.duration >= 0
  );
}

export function parseRecentlyPlayedTracks(value: string | null): PlaylistTrack[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    const seenTrackIds = new Set<string>();
    return parsed
      .filter(isPlaylistTrack)
      .filter((track) => {
        if (seenTrackIds.has(track.id)) return false;
        seenTrackIds.add(track.id);
        return true;
      })
      .slice(0, MAX_RECENT_TRACKS);
  } catch {
    return [];
  }
}

export function recordRecentlyPlayedTrack(
  tracks: PlaylistTrack[],
  track: PlaylistTrack
): PlaylistTrack[] {
  return [track, ...tracks.filter((existingTrack) => existingTrack.id !== track.id)].slice(
    0,
    MAX_RECENT_TRACKS
  );
}

export function serializeRecentlyPlayedTracks(tracks: PlaylistTrack[]): string {
  return JSON.stringify(tracks.slice(0, MAX_RECENT_TRACKS));
}
