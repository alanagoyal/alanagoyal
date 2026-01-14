"use client";

import { useEffect, useRef } from "react";
import { Photo } from "@/types/photos";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { format, parseISO } from "date-fns";
import Image from "next/image";

interface PhotoViewerProps {
  photo: Photo;
  photos: Photo[]; // All photos for prefetching
  currentIndex: number;
  totalPhotos: number;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
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
  isMobileView,
  isDesktop = false,
}: PhotoViewerProps) {
  const windowFocus = useWindowFocus();
  const inShell = isDesktop && windowFocus;
  const containerRef = useRef<HTMLDivElement>(null);

  // Get adjacent photos for prefetching
  const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

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
          "px-4 py-3 flex items-center justify-between border-b dark:border-foreground/20",
          isMobileView ? "bg-background" : "bg-muted/50"
        )}
        onMouseDown={inShell && !isMobileView ? windowFocus.onDragStart : undefined}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center text-[#0A84FF] hover:text-[#0A84FF]/80 -ml-2"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Date and counter */}
        <div className="text-center">
          <p className="text-sm font-medium">{formattedDate}</p>
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} of {totalPhotos}
          </p>
        </div>

        {/* Spacer for centering */}
        <div className="w-6" />
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center min-h-0 bg-muted/30">
        <div className="relative w-full h-full">
          <Image
            src={`/photos/${photo.filename}`}
            alt=""
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* Prefetch adjacent photos (hidden) */}
        {prevPhoto && (
          <Image
            src={`/photos/${prevPhoto.filename}`}
            alt=""
            width={1}
            height={1}
            className="sr-only"
            priority
          />
        )}
        {nextPhoto && (
          <Image
            src={`/photos/${nextPhoto.filename}`}
            alt=""
            width={1}
            height={1}
            className="sr-only"
            priority
          />
        )}
      </div>
    </div>
  );
}
