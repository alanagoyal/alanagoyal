export const MUSIC_RECENTLY_PLAYED_STORAGE_KEY = "music-recently-played";

const MAX_RECENT_TRACKS = 8;

export function parseRecentlyPlayedTrackIds(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(parsed.filter((trackId): trackId is string => typeof trackId === "string" && trackId.length > 0))
    ).slice(0, MAX_RECENT_TRACKS);
  } catch {
    return [];
  }
}

export function recordRecentlyPlayedTrack(trackIds: string[], trackId: string): string[] {
  if (!trackId) return trackIds.slice(0, MAX_RECENT_TRACKS);
  return [trackId, ...trackIds.filter((existingId) => existingId !== trackId)].slice(
    0,
    MAX_RECENT_TRACKS
  );
}

export function serializeRecentlyPlayedTrackIds(trackIds: string[]): string {
  return JSON.stringify(trackIds.slice(0, MAX_RECENT_TRACKS));
}
