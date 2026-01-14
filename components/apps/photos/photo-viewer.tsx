"use client";

import { useEffect } from "react";
import { Photo } from "@/types/photos";
import { ChevronLeft, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { format, parseISO } from "date-fns";
import Image from "next/image";

// Preload an image using native browser caching
function preloadImage(url: string) {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.src = url;
}

interface PhotoViewerProps {
  photo: Photo;
  photos: Photo[]; // All photos for prefetching
  currentIndex: number;
  totalPhotos: number;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleFavorite?: (photoId: string) => void;
  isMobileView: boolean;
  isDesktop?: boolean;
}

export function PhotoViewer({
  photo,
  photos,
  currentIndex,
  totalPhotos,
  onBack,
  onPrevious,
  onNext,
  onToggleFavorite,
  isMobileView,
  isDesktop = false,
}: PhotoViewerProps) {
  const windowFocus = useWindowFocus();
  const inShell = isDesktop && windowFocus;

  // Preload adjacent photos (3 in each direction) when current photo changes
  useEffect(() => {
    const preloadRange = 3;
    for (let i = 1; i <= preloadRange; i++) {
      if (currentIndex - i >= 0) {
        preloadImage(photos[currentIndex - i].url);
      }
      if (currentIndex + i < photos.length) {
        preloadImage(photos[currentIndex + i].url);
      }
    }
  }, [currentIndex, photos]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        onPrevious();
      } else if (e.key === "ArrowRight") {
        onNext();
      } else if (e.key === "Escape") {
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrevious, onNext, onBack]);

  const formattedDate = format(
    parseISO(photo.timestamp),
    "MMMM d, yyyy 'at' h:mm:ss a"
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - matches PhotosGrid header style */}
      <div
        className={cn(
          "px-4 py-3 flex items-center justify-between border-b dark:border-foreground/20 select-none",
          isMobileView ? "bg-background" : "bg-muted/50"
        )}
        onMouseDown={inShell && !isMobileView ? windowFocus.onDragStart : undefined}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center -ml-2"
        >
          <ChevronLeft className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>

        {/* Date and counter */}
        <div className="text-center">
          <p className="text-sm font-medium">{formattedDate}</p>
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} of {totalPhotos}
          </p>
        </div>

        {/* Favorite button */}
        <button
          onClick={() => onToggleFavorite?.(photo.id)}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 -mr-1"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              photo.isFavorite
                ? "fill-white text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            )}
          />
        </button>
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center min-h-0 bg-muted/30">
        <div className="relative w-full h-full">
          <Image
            src={photo.url}
            alt=""
            fill
            className="object-contain"
            sizes="100vw"
            priority
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
