"use client";

import { useEffect, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Photo } from "@/types/photos";
import { ChevronLeft, Heart, RotateCcwSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { toZonedTime } from "date-fns-tz";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { getViewerUrl } from "@/lib/photos/image-utils";

// Preload an image for faster navigation
function preloadImage(url: string) {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.src = getViewerUrl(url);
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
  rotation: number;
  onRotate: () => void;
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
  rotation,
  onRotate,
  isMobileView,
  isDesktop = false,
}: PhotoViewerProps) {
  const windowFocus = useWindowFocus();
  const inShell = isDesktop && windowFocus;
  const [isSwiping, setIsSwiping] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{
    photoId: string;
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Prevent default touch move when swiping to avoid scroll interference
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (isSwiping && e.cancelable) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventDefault);
    };
  }, [isSwiping]);

  // Swipe handlers for mobile navigation
  const swipeHandlers = useSwipeable({
    onSwipeStart: () => setIsSwiping(true),
    onSwiped: () => setIsSwiping(false),
    onSwipedLeft: () => onNext(),
    onSwipedRight: () => onPrevious(),
    trackMouse: false,
    delta: 50,
    preventScrollOnSwipe: true,
  });

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

  // Handle keyboard navigation (only when Photos app is focused)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if Photos app is focused
      const photosApp = document.querySelector('[data-app="photos"]');
      if (!photosApp?.contains(document.activeElement) && document.activeElement !== photosApp) {
        return;
      }

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

  const pstDate = toZonedTime(parseISO(photo.timestamp), "America/Los_Angeles");
  const formattedDate = format(pstDate, "MMMM d, yyyy 'at' h:mm:ss a");
  const currentNaturalSize =
    naturalSize?.photoId === photo.id ? naturalSize : null;
  const isQuarterTurn = rotation % 180 !== 0;

  let displayedImageSize: { width: number; height: number } | null = null;
  if (
    currentNaturalSize &&
    containerSize &&
    containerSize.width > 0 &&
    containerSize.height > 0
  ) {
    const rotatedWidth = isQuarterTurn
      ? currentNaturalSize.height
      : currentNaturalSize.width;
    const rotatedHeight = isQuarterTurn
      ? currentNaturalSize.width
      : currentNaturalSize.height;
    const scale = Math.min(
      containerSize.width / rotatedWidth,
      containerSize.height / rotatedHeight,
    );
    const fittedWidth = rotatedWidth * scale;
    const fittedHeight = rotatedHeight * scale;

    displayedImageSize = isQuarterTurn
      ? { width: fittedHeight, height: fittedWidth }
      : { width: fittedWidth, height: fittedHeight };
  }

  const handleImageLoad = (image: HTMLImageElement) => {
    setNaturalSize({
      photoId: photo.id,
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
  };

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
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Date and counter */}
        <div className="text-center">
          <p className="text-sm font-medium">{formattedDate}</p>
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} of {totalPhotos}
          </p>
        </div>

        {/* Photo actions */}
        <div
          className="flex items-center gap-1 -mr-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onToggleFavorite?.(photo.id)}
            className="p-1 rounded can-hover:hover:bg-muted"
            aria-label={
              photo.isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            title={photo.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors text-foreground",
                photo.isFavorite && "fill-foreground"
              )}
            />
          </button>
          <button
            onClick={onRotate}
            className="p-1 rounded text-foreground transition-colors can-hover:hover:bg-muted"
            aria-label="Rotate left"
            title="Rotate Left"
          >
            <RotateCcwSquare
              aria-hidden="true"
              className="h-4 w-4"
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* Photo with swipe support */}
      <div
        {...swipeHandlers}
        className="flex-1 flex items-center justify-center min-h-0 bg-muted/30"
      >
        <div
          ref={imageContainerRef}
          className="relative flex h-full w-full items-center justify-center overflow-hidden"
        >
          {displayedImageSize ? (
            <Image
              key={photo.id}
              src={getViewerUrl(photo.url)}
              alt=""
              width={Math.max(1, Math.round(displayedImageSize.width))}
              height={Math.max(1, Math.round(displayedImageSize.height))}
              draggable={false}
              style={{
                width: displayedImageSize.width,
                height: displayedImageSize.height,
                transform: rotation ? `rotate(${rotation}deg)` : undefined,
                transition:
                  "width 0.15s ease-out, height 0.15s ease-out, transform 0.2s ease-out",
              }}
              onLoad={(event) => handleImageLoad(event.currentTarget)}
              priority
              unoptimized
            />
          ) : (
            <Image
              key={photo.id}
              src={getViewerUrl(photo.url)}
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 80vw"
              onLoad={(event) => handleImageLoad(event.currentTarget)}
              priority
              unoptimized
            />
          )}
        </div>
      </div>
    </div>
  );
}
