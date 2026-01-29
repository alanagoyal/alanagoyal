"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AlbumsViewProps {
  albums: { id: string; name: string; artist: string; albumArt: string; trackCount: number }[];
  isMobileView: boolean;
}

export function AlbumsView({ albums, isMobileView }: AlbumsViewProps) {
  return (
    <ScrollArea className="h-full" bottomMargin="0">
      <div className={cn("p-6", isMobileView && "p-4")}>
        <h2 className="text-lg font-semibold mb-4">Albums</h2>
        <div
          className={cn(
            "grid gap-4",
            isMobileView ? "grid-cols-2" : "grid-cols-3 lg:grid-cols-5"
          )}
        >
          {albums.map((album) => (
            <div key={album.id} className="group cursor-pointer">
              <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-muted shadow-md">
                <Image
                  src={album.albumArt}
                  alt={album.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
              <p className="text-sm font-medium truncate">{album.name}</p>
              <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
