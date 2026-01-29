"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ArtistsViewProps {
  artists: { id: string; name: string; image: string; trackCount: number }[];
  isMobileView: boolean;
}

export function ArtistsView({ artists, isMobileView }: ArtistsViewProps) {
  return (
    <ScrollArea className="h-full" bottomMargin="0">
      <div className={cn("p-6", isMobileView && "p-4")}>
        <div>
          <h2 className="text-lg font-semibold mb-4">Artists</h2>
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
