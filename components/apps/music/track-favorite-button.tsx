"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlaylistTrack } from "./types";

export function TrackFavoriteButton({
  track,
  isFavorite,
  isMobileView,
  onToggle,
}: {
  track: PlaylistTrack;
  isFavorite: boolean;
  isMobileView: boolean;
  onToggle: (trackId: string) => void;
}) {
  const label = isFavorite
    ? `Undo favorite ${track.name}`
    : `Favorite ${track.name}`;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isFavorite}
      title={isFavorite ? "Undo Favorite" : "Favorite"}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(track.id);
      }}
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full transition-colors can-hover:hover:bg-muted",
        isMobileView ? "h-11 w-11" : "h-8 w-16",
        isFavorite ? "text-red-500" : "text-muted-foreground"
      )}
    >
      <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
    </button>
  );
}
