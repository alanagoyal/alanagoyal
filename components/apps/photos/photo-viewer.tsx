"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Photo } from "@/types/photos";
import { Camera, ChevronLeft, Heart, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { useWindowFocus } from "@/lib/window-focus-context";
import { toZonedTime } from "date-fns-tz";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { getViewerUrl } from "@/lib/photos/image-utils";
import {
  formatCameraName,
  formatDimensions,
  formatExposureCompensation,
  formatExposureTime,
  formatFileSize,
  formatLensDescription,
  formatMegapixels,
  formatPhotoType,
  loadPhotoMetadata,
} from "@/lib/photos/photo-metadata";
import type { PhotoMetadata } from "@/lib/photos/photo-metadata";

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
  collectionNames: string[];
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
  collectionNames,
  isMobileView,
  isDesktop = false,
}: PhotoViewerProps) {
  const windowFocus = useWindowFocus();
  const inShell = isDesktop && windowFocus;
  const [isSwiping, setIsSwiping] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState(false);
  const infoContainerRef = useRef<HTMLDivElement>(null);
  const closeInfo = useCallback(() => setIsInfoOpen(false), []);

  useClickOutside(infoContainerRef, closeInfo, isInfoOpen);

  useEffect(() => {
    if (!isInfoOpen) return;

    let isCurrent = true;
    setMetadata(null);
    setMetadataError(false);
    setIsMetadataLoading(true);

    loadPhotoMetadata(photo.url)
      .then((photoMetadata) => {
        if (isCurrent) setMetadata(photoMetadata);
      })
      .catch(() => {
        if (isCurrent) setMetadataError(true);
      })
      .finally(() => {
        if (isCurrent) setIsMetadataLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isInfoOpen, photo.url]);

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
  const cameraName = metadata ? formatCameraName(metadata) : undefined;
  const lensDescription = metadata
    ? formatLensDescription(metadata)
    : undefined;
  const dimensions = metadata ? formatDimensions(metadata) : undefined;
  const megapixels = metadata ? formatMegapixels(metadata) : undefined;
  const hasExposureDetails = Boolean(
    metadata &&
      (metadata.iso !== undefined ||
        metadata.focalLength35mm !== undefined ||
        metadata.exposureCompensation !== undefined ||
        metadata.fNumber !== undefined ||
        metadata.exposureTime !== undefined)
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
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Date and counter */}
        <div className="text-center">
          <p className="text-sm font-medium">{formattedDate}</p>
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} of {totalPhotos}
          </p>
        </div>

        <div className="flex items-center gap-1 -mr-1">
          <div
            ref={infoContainerRef}
            className="relative"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label={isInfoOpen ? "Hide photo information" : "Show photo information"}
              aria-expanded={isInfoOpen}
              aria-controls="photo-info-panel"
              onClick={() => setIsInfoOpen((open) => !open)}
              className={cn(
                "rounded-md p-1 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A7CFF]",
                isInfoOpen
                  ? "bg-foreground/10"
                  : "can-hover:hover:bg-foreground/10"
              )}
            >
              <Info className="h-5 w-5" />
            </button>

            {isInfoOpen && (
              <aside
                id="photo-info-panel"
                aria-label="Photo information"
                className="absolute right-0 top-[calc(100%+12px)] z-20 w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-xl border border-black/10 bg-muted/95 text-foreground shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-2xl dark:border-white/15"
              >
                <div className="relative flex h-8 items-center justify-center border-b border-black/10 px-3 dark:border-white/10">
                  <div className="absolute left-3 flex gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Info</p>
                </div>

                <div className="max-h-[calc(100vh-112px)] overflow-y-auto">
                  <div className="flex items-start justify-between gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-medium leading-5">{photo.filename}</p>
                      <time
                        dateTime={photo.timestamp}
                        className="mt-0.5 block text-xs leading-4 text-muted-foreground"
                      >
                        {formattedDate}
                      </time>
                    </div>
                    <Heart
                      aria-label={photo.isFavorite ? "Favorite" : "Not a favorite"}
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
                        photo.isFavorite && "fill-foreground text-foreground"
                      )}
                    />
                  </div>

                  <section
                    aria-label="Camera details"
                    aria-live="polite"
                    className="border-t border-black/10 px-3 py-3 dark:border-white/10"
                  >
                    {isMetadataLoading && (
                      <div className="animate-pulse space-y-2" aria-label="Loading camera details">
                        <div className="h-3 w-32 rounded bg-muted-foreground/20" />
                        <div className="h-3 w-48 rounded bg-muted-foreground/15" />
                        <div className="h-3 w-40 rounded bg-muted-foreground/15" />
                      </div>
                    )}

                    {metadataError && (
                      <p className="text-xs text-muted-foreground">
                        Camera information unavailable
                      </p>
                    )}

                    {metadata && (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-5">
                              {cameraName ?? "Photo"}
                            </p>
                            {lensDescription && (
                              <p className="text-xs leading-4 text-muted-foreground">
                                {lensDescription}
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                              {dimensions && <span>{dimensions}</span>}
                              {megapixels && <span>{megapixels}</span>}
                              <span>{formatFileSize(metadata.fileSize)}</span>
                              <span className="rounded bg-muted-foreground/20 px-1 py-0.5 text-[10px] font-semibold leading-none text-foreground/70">
                                {formatPhotoType(metadata.mimeType, photo.filename)}
                              </span>
                            </div>
                          </div>
                          <Camera
                            aria-hidden="true"
                            className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                          />
                        </div>

                        {hasExposureDetails && (
                          <dl className="mt-3 grid grid-cols-5 gap-1 border-t border-black/10 pt-2 text-center text-[10px] leading-4 text-muted-foreground dark:border-white/10">
                            <div>
                              <dt className="sr-only">ISO</dt>
                              <dd>{metadata.iso !== undefined ? `ISO ${metadata.iso}` : "—"}</dd>
                            </div>
                            <div>
                              <dt className="sr-only">Focal length</dt>
                              <dd>
                                {metadata.focalLength35mm !== undefined
                                  ? `${Math.round(metadata.focalLength35mm)} mm`
                                  : "—"}
                              </dd>
                            </div>
                            <div>
                              <dt className="sr-only">Exposure compensation</dt>
                              <dd>
                                {metadata.exposureCompensation !== undefined
                                  ? formatExposureCompensation(metadata.exposureCompensation)
                                  : "—"}
                              </dd>
                            </div>
                            <div>
                              <dt className="sr-only">Aperture</dt>
                              <dd>
                                {metadata.fNumber !== undefined
                                  ? `ƒ${metadata.fNumber.toFixed(1)}`
                                  : "—"}
                              </dd>
                            </div>
                            <div>
                              <dt className="sr-only">Shutter speed</dt>
                              <dd>
                                {metadata.exposureTime !== undefined
                                  ? formatExposureTime(metadata.exposureTime)
                                  : "—"}
                              </dd>
                            </div>
                          </dl>
                        )}
                      </>
                    )}
                  </section>

                  <dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-black/10 px-3 py-3 text-xs dark:border-white/10">
                    <dt className="text-muted-foreground">Favorite</dt>
                    <dd>{photo.isFavorite ? "Yes" : "No"}</dd>
                    <dt className="text-muted-foreground">Collections</dt>
                    <dd className="min-w-0 break-words">
                      {collectionNames.length > 0 ? collectionNames.join(", ") : "None"}
                    </dd>
                  </dl>
                </div>
              </aside>
            )}
          </div>

          <button
            onClick={() => onToggleFavorite?.(photo.id)}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors text-foreground",
                photo.isFavorite && "fill-foreground"
              )}
            />
          </button>
        </div>
      </div>

      {/* Photo with swipe support */}
      <div
        {...swipeHandlers}
        className="flex-1 flex items-center justify-center min-h-0 bg-muted/30"
      >
        <div className="relative w-full h-full">
          <Image
            key={photo.id}
            src={getViewerUrl(photo.url)}
            alt=""
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
