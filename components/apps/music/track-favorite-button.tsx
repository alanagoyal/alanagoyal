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
        "flex flex-shrink-0 items-center justify-center rounded-full text-red-500 transition-[color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
        isMobileView ? "h-11 w-11" : "h-8 w-16",
        !isMobileView &&
          !isFavorite &&
          "opacity-0 can-hover:group-hover:opacity-100 focus-visible:opacity-100"
      )}
    >
      <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
    </button>
  );
}
