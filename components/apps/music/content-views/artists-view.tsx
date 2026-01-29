"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TopArtists } from "../types";

interface ArtistsViewProps {
  artists: { id: string; name: string; image: string; trackCount: number }[];
  topArtists: TopArtists | null;
  isMobileView: boolean;
}

export function ArtistsView({ artists, topArtists, isMobileView }: ArtistsViewProps) {
  // Combine local and Spotify artists
  const spotifyArtists = topArtists?.items || [];

  return (
    <ScrollArea className="h-full" bottomMargin="0">
      <div className={cn("p-6", isMobileView && "p-4")}>
        {/* Top Artists from Spotify */}
        {spotifyArtists.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Your Top Artists</h2>
            <div
              className={cn(
                "grid gap-6",
                isMobileView ? "grid-cols-2" : "grid-cols-4 lg:grid-cols-6"
              )}
            >
              {spotifyArtists.map((artist) => (
                <div key={artist.id} className="group cursor-pointer text-center">
                  <div className="relative aspect-square rounded-full overflow-hidden mb-3 bg-muted mx-auto">
                    {artist.images?.[0] && (
                      <Image
                        src={artist.images[0].url}
                        alt={artist.name}
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  <p className="text-sm font-medium truncate">{artist.name}</p>
                  {artist.genres && artist.genres.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate capitalize">
                      {artist.genres[0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local Artists */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {spotifyArtists.length > 0 ? "From Your Library" : "Artists"}
          </h2>
          <div
            className={cn(
              "grid gap-6",
              isMobileView ? "grid-cols-2" : "grid-cols-4 lg:grid-cols-6"
            )}
          >
            {artists.map((artist) => (
              <div key={artist.id} className="group cursor-pointer text-center">
                <div className="relative aspect-square rounded-full overflow-hidden mb-3 bg-muted mx-auto">
                  <Image
                    src={artist.image}
                    alt={artist.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <p className="text-sm font-medium truncate">{artist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {artist.trackCount} {artist.trackCount === 1 ? "song" : "songs"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
