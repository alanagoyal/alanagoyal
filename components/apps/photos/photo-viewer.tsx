"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Photo } from "@/types/photos";
import {
  Camera,
  ChevronLeft,
  Heart,
  Info,
  RotateCcwSquare,
} from "lucide-react";
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
import {
  createPhotoWheelGestureState,
  handlePhotoWheelGesture,
} from "@/lib/photos/wheel-navigation";
import {
  getPhotoGestureOffset,
  getPhotoSlideIndexes,
  getPhotoSlideTransform,
  PHOTO_SLIDE_DURATION_MS,
  PHOTO_SLIDE_EASING,
  PHOTO_SWIPE_CANCEL_DURATION_MS,
  PHOTO_SWIPE_SETTLE_IDLE_MS,
  shouldAnimatePhotoNavigation,
  shouldCommitTouchPhotoSwipe,
} from "@/lib/photos/photo-transition";
import type {
  PhotoGestureSource,
  PhotoNavigationDirection,
  PhotoNavigationSource,
} from "@/lib/photos/photo-transition";

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
  photoRotations: Record<string, number>;
  onRotate: () => void;
  collectionNames: string[];
  isMobileView: boolean;
  isDesktop?: boolean;
}

interface CameraDetailsProps {
  metadata: PhotoMetadata | null;
  isLoading: boolean;
  hasError: boolean;
  filename: string;
  variant: "desktop" | "mobile";
}

function CameraDetails({
  metadata,
  isLoading,
  hasError,
  filename,
  variant,
}: CameraDetailsProps) {
  const isMobile = variant === "mobile";
  const cameraName = metadata ? formatCameraName(metadata) : undefined;
  const lensDescription = metadata
    ? formatLensDescription(metadata)
    : undefined;
  const dimensions = metadata ? formatDimensions(metadata) : undefined;
  const megapixels = metadata ? formatMegapixels(metadata) : undefined;
  const photoType = metadata
    ? formatPhotoType(metadata.mimeType, filename)
    : undefined;
  const hasExposureDetails = Boolean(
    metadata &&
      (metadata.iso !== undefined ||
        metadata.focalLength35mm !== undefined ||
        metadata.exposureCompensation !== undefined ||
        metadata.fNumber !== undefined ||
        metadata.exposureTime !== undefined)
  );

  return (
    <section
      aria-label="Camera details"
      aria-live="polite"
      className={cn(
        isMobile
          ? "overflow-hidden rounded-xl bg-muted/70"
          : "border-t border-black/10 px-3 py-3 dark:border-white/10"
      )}
    >
      {isLoading && (
        <div
          className={cn("animate-pulse space-y-2", isMobile && "p-3")}
          aria-label="Loading camera details"
        >
          <div className="h-3 w-32 rounded bg-muted-foreground/20" />
          <div className="h-3 w-48 rounded bg-muted-foreground/15" />
          <div className="h-3 w-40 rounded bg-muted-foreground/15" />
        </div>
      )}

      {hasError && (
        <p className={cn("text-xs text-muted-foreground", isMobile && "p-3")}>
          Camera information unavailable
        </p>
      )}

      {metadata && (
        <>
          <div
            className={cn(
              "flex items-start justify-between gap-3",
              isMobile && "px-3 py-2.5"
            )}
          >
            <div className="min-w-0">
              <p
                className={cn(
                  "font-medium leading-5",
                  isMobile ? "text-base" : "text-sm"
                )}
              >
                {cameraName ?? "Photo"}
              </p>
              {lensDescription && (
                <p
                  className={cn(
                    "text-muted-foreground",
                    isMobile ? "mt-2 text-sm leading-5" : "text-xs leading-4"
                  )}
                >
                  {lensDescription}
                </p>
              )}
              <div
                className={cn(
                  "flex flex-wrap items-center text-muted-foreground",
                  isMobile
                    ? "mt-1 gap-x-1.5 text-sm leading-5"
                    : "mt-1 gap-x-2 gap-y-1 text-xs"
                )}
              >
                {isMobile ? (
                  <>
                    {megapixels && <span>{megapixels}</span>}
                    {megapixels && dimensions && <span aria-hidden="true">•</span>}
                    {dimensions && <span>{dimensions}</span>}
                    {metadata.fileSize > 0 && <span aria-hidden="true">•</span>}
                    <span>{formatFileSize(metadata.fileSize)}</span>
                  </>
                ) : (
                  <>
                    {dimensions && <span>{dimensions}</span>}
                    {megapixels && <span>{megapixels}</span>}
                    <span>{formatFileSize(metadata.fileSize)}</span>
                    <span className="rounded bg-muted-foreground/20 px-1 py-0.5 text-[10px] font-semibold leading-none text-foreground/70">
                      {photoType}
                    </span>
                  </>
                )}
              </div>
            </div>

            {isMobile ? (
              <span className="rounded bg-muted-foreground/20 px-1.5 py-1 text-[11px] font-semibold leading-none text-foreground/70">
                {photoType}
              </span>
            ) : (
              <Camera
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
              />
            )}
          </div>

          {hasExposureDetails && (
            <dl
              className={cn(
                "grid grid-cols-5 gap-1 border-t border-black/10 text-center text-muted-foreground dark:border-white/10",
                isMobile
                  ? "px-2 py-2 text-[11px] leading-4"
                  : "mt-3 pt-2 text-[10px] leading-4"
              )}
            >
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
  );
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
  photoRotations,
  onRotate,
  collectionNames,
  isMobileView,
  isDesktop = false,
}: PhotoViewerProps) {
  const windowFocus = useWindowFocus();
  const inShell = isDesktop && windowFocus;
  const [isSwiping, setIsSwiping] = useState(false);
  const [shouldAnimateRotation, setShouldAnimateRotation] = useState(false);
  const [naturalSizes, setNaturalSizes] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const gestureTrackRef = useRef<HTMLDivElement>(null);
  const gestureFrameRef = useRef<number | null>(null);
  const gestureSettleTimerRef = useRef<number | null>(null);
  const gestureAnimationRef = useRef<Animation | null>(null);
  const pendingGestureOffsetRef = useRef(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState(false);
  const infoContainerRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const wheelGestureStateRef = useRef(createPhotoWheelGestureState());
  // Keep the wheel listener stable while the selected photo changes so the
  // momentum tail cannot be mistaken for a fresh gesture after every render.
  const navigationContextRef = useRef({
    currentIndex,
    photoCount: photos.length,
    onPrevious,
    onNext,
  });
  navigationContextRef.current = {
    currentIndex,
    photoCount: photos.length,
    onPrevious,
    onNext,
  };
  const [shouldAnimateSlides, setShouldAnimateSlides] = useState(false);
  const closeInfo = useCallback(() => setIsInfoOpen(false), []);
  const rotateLeft = useCallback(() => {
    setShouldAnimateRotation(true);
    onRotate();
  }, [onRotate]);

  useClickOutside(infoContainerRef, closeInfo, isInfoOpen);

  const clearGestureSettleTimer = useCallback(() => {
    if (gestureSettleTimerRef.current === null) return;
    window.clearTimeout(gestureSettleTimerRef.current);
    gestureSettleTimerRef.current = null;
  }, []);

  const cancelGestureAnimation = useCallback(() => {
    const animation = gestureAnimationRef.current;
    if (!animation) return;

    const track = gestureTrackRef.current;
    const currentTransform = track
      ? window.getComputedStyle(track).transform
      : null;

    animation.onfinish = null;
    animation.cancel();
    gestureAnimationRef.current = null;

    if (track && currentTransform && currentTransform !== "none") {
      track.style.transform = currentTransform;
    }
  }, []);

  const settleGestureOffset = useCallback(
    (duration: number) => {
      clearGestureSettleTimer();

      const track = gestureTrackRef.current;
      if (!track) return;

      if (gestureFrameRef.current !== null) {
        window.cancelAnimationFrame(gestureFrameRef.current);
        gestureFrameRef.current = null;
        track.style.transform = `translate3d(${pendingGestureOffsetRef.current}px, 0, 0)`;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion || duration === 0) {
        cancelGestureAnimation();
        pendingGestureOffsetRef.current = 0;
        track.style.transform = "translate3d(0, 0, 0)";
        return;
      }

      cancelGestureAnimation();
      const fromTransform = window.getComputedStyle(track).transform;
      const animation = track.animate(
        [
          { transform: fromTransform },
          { transform: "translate3d(0, 0, 0)" },
        ],
        {
          duration,
          easing: PHOTO_SLIDE_EASING,
          fill: "both",
        },
      );

      gestureAnimationRef.current = animation;
      animation.onfinish = () => {
        if (gestureAnimationRef.current !== animation) return;
        animation.onfinish = null;
        pendingGestureOffsetRef.current = 0;
        track.style.transform = "translate3d(0, 0, 0)";
        animation.cancel();
        gestureAnimationRef.current = null;
      };
    },
    [cancelGestureAnimation, clearGestureSettleTimer],
  );

  const updateGestureOffset = useCallback(
    (offset: number) => {
      clearGestureSettleTimer();

      const track = gestureTrackRef.current;
      if (!track) return;

      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        settleGestureOffset(0);
        return;
      }

      cancelGestureAnimation();
      pendingGestureOffsetRef.current = offset;

      if (gestureFrameRef.current !== null) return;
      gestureFrameRef.current = window.requestAnimationFrame(() => {
        gestureFrameRef.current = null;
        const currentTrack = gestureTrackRef.current;
        if (!currentTrack) return;
        currentTrack.style.transform = `translate3d(${pendingGestureOffsetRef.current}px, 0, 0)`;
      });
    },
    [
      cancelGestureAnimation,
      clearGestureSettleTimer,
      settleGestureOffset,
    ],
  );

  const queueGestureSettle = useCallback(() => {
    clearGestureSettleTimer();
    gestureSettleTimerRef.current = window.setTimeout(() => {
      gestureSettleTimerRef.current = null;
      settleGestureOffset(PHOTO_SWIPE_CANCEL_DURATION_MS);
    }, PHOTO_SWIPE_SETTLE_IDLE_MS);
  }, [clearGestureSettleTimer, settleGestureOffset]);

  const updateGestureFromDelta = useCallback(
    (deltaX: number, source: PhotoGestureSource) => {
      const viewportWidth = imageContainerRef.current?.clientWidth ?? 0;
      const { currentIndex: activeIndex, photoCount } =
        navigationContextRef.current;
      updateGestureOffset(
        getPhotoGestureOffset({
          deltaX,
          viewportWidth,
          canGoPrevious: activeIndex > 0,
          canGoNext: activeIndex < photoCount - 1,
          source,
        }),
      );
    },
    [updateGestureOffset],
  );

  const navigatePhoto = useCallback(
    (
      direction: PhotoNavigationDirection,
      source: PhotoNavigationSource,
    ): boolean => {
      const {
        currentIndex: activeIndex,
        photoCount,
        onPrevious: navigatePrevious,
        onNext: navigateNext,
      } = navigationContextRef.current;
      const canNavigate =
        direction === "previous"
          ? activeIndex > 0
          : activeIndex < photoCount - 1;

      if (!canNavigate) {
        settleGestureOffset(PHOTO_SWIPE_CANCEL_DURATION_MS);
        return false;
      }

      const animate = shouldAnimatePhotoNavigation(
        source,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
      setShouldAnimateSlides(animate);

      if (direction === "previous") {
        navigatePrevious();
      } else {
        navigateNext();
      }

      settleGestureOffset(animate ? PHOTO_SLIDE_DURATION_MS : 0);
      return true;
    },
    [settleGestureOffset],
  );

  useEffect(() => {
    if (!shouldAnimateSlides) return;

    const timer = window.setTimeout(() => {
      setShouldAnimateSlides(false);
    }, PHOTO_SLIDE_DURATION_MS + 40);

    return () => window.clearTimeout(timer);
  }, [currentIndex, shouldAnimateSlides]);

  useEffect(() => {
    return () => {
      clearGestureSettleTimer();
      if (gestureFrameRef.current !== null) {
        window.cancelAnimationFrame(gestureFrameRef.current);
        gestureFrameRef.current = null;
      }
      const animation = gestureAnimationRef.current;
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
        gestureAnimationRef.current = null;
      }
    };
  }, [clearGestureSettleTimer]);

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

  useEffect(() => {
    // Mobile keeps native vertical wheel scrolling for the information panel;
    // touch swipes already handle photo navigation there.
    if (isMobileView) return;

    const container = imageContainerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      let navigationAttempted = false;
      const result = handlePhotoWheelGesture(
        wheelGestureStateRef.current,
        event,
        {
          onPrevious: () => {
            navigationAttempted = true;
            navigatePhoto("previous", "wheel");
          },
          onNext: () => {
            navigationAttempted = true;
            navigatePhoto("next", "wheel");
          },
        },
      );

      if (!result.captured) return;

      event.stopPropagation();
      wheelGestureStateRef.current = result.state;

      if (
        navigationAttempted ||
        (result.state.phase === "locked" &&
          result.state.restartDeltaX === 0)
      ) {
        return;
      }

      const gestureDeltaX =
        result.state.phase === "tracking"
          ? result.state.accumulatedDeltaX
          : result.state.restartDeltaX;
      updateGestureFromDelta(-gestureDeltaX, "wheel");
      queueGestureSettle();
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      wheelGestureStateRef.current = createPhotoWheelGestureState();
    };
  }, [
    isMobileView,
    navigatePhoto,
    queueGestureSettle,
    updateGestureFromDelta,
  ]);

  useEffect(() => {
    if (!isInfoOpen && !isMobileView) return;

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
  }, [isInfoOpen, isMobileView, photo.url]);

  useEffect(() => {
    mobileScrollRef.current?.scrollTo({ top: 0 });
    setShouldAnimateRotation(false);
  }, [photo.id]);

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

  // Swipe handlers for mobile navigation and direct gesture tracking
  const swipeHandlers = useSwipeable({
    onSwipeStart: ({ dir }) => {
      setIsSwiping(dir === "Left" || dir === "Right");
    },
    onSwiping: ({ deltaX, dir }) => {
      if (dir !== "Left" && dir !== "Right") return;
      updateGestureFromDelta(deltaX, "touch");
    },
    onSwiped: ({ absX, dir, velocity }) => {
      setIsSwiping(false);

      if (
        (dir !== "Left" && dir !== "Right") ||
        !shouldCommitTouchPhotoSwipe({
          distance: absX,
          velocity,
          viewportWidth: imageContainerRef.current?.clientWidth ?? 0,
        })
      ) {
        settleGestureOffset(PHOTO_SWIPE_CANCEL_DURATION_MS);
        return;
      }

      navigatePhoto(dir === "Left" ? "next" : "previous", "touch");
    },
    trackMouse: false,
    delta: 10,
    preventScrollOnSwipe: !isMobileView,
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
        navigatePhoto("previous", "keyboard");
      } else if (e.key === "ArrowRight") {
        navigatePhoto("next", "keyboard");
      } else if (e.key === "Escape") {
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigatePhoto, onBack]);

  const pstDate = toZonedTime(parseISO(photo.timestamp), "America/Los_Angeles");
  const formattedDate = format(pstDate, "MMMM d, yyyy 'at' h:mm:ss a");
  const slideIndexes = getPhotoSlideIndexes(currentIndex, photos.length);

  const getDisplayedImageSize = (
    photoId: string,
    photoRotation: number,
  ): { width: number; height: number } | null => {
    const naturalSize = naturalSizes[photoId];
    if (
      photoRotation === 0 ||
      !naturalSize ||
      !containerSize ||
      containerSize.width <= 0 ||
      containerSize.height <= 0
    ) {
      return null;
    }

    const isQuarterTurn = photoRotation % 180 !== 0;
    const rotatedWidth = isQuarterTurn
      ? naturalSize.height
      : naturalSize.width;
    const rotatedHeight = isQuarterTurn
      ? naturalSize.width
      : naturalSize.height;
    const scale = Math.min(
      containerSize.width / rotatedWidth,
      containerSize.height / rotatedHeight,
    );
    const fittedWidth = rotatedWidth * scale;
    const fittedHeight = rotatedHeight * scale;

    return isQuarterTurn
      ? { width: fittedHeight, height: fittedWidth }
      : { width: fittedWidth, height: fittedHeight };
  };

  const handleImageLoad = (photoId: string, image: HTMLImageElement) => {
    setNaturalSizes((currentSizes) => {
      const currentSize = currentSizes[photoId];
      if (
        currentSize?.width === image.naturalWidth &&
        currentSize.height === image.naturalHeight
      ) {
        return currentSizes;
      }

      return {
        ...currentSizes,
        [photoId]: {
          width: image.naturalWidth,
          height: image.naturalHeight,
        },
      };
    });
  };
  const mobileFormattedDate = format(
    pstDate,
    "EEEE · MMMM d, yyyy · h:mm a"
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - matches PhotosGrid header style */}
      <div
        className={cn(
          "relative px-4 py-3 flex items-center justify-between border-b dark:border-foreground/20 select-none",
          isMobileView ? "h-[69px] bg-background" : "bg-muted/50"
        )}
        onMouseDown={inShell && !isMobileView ? windowFocus.onDragStart : undefined}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Back to photo grid"
          className="flex items-center -ml-2"
        >
          <ChevronLeft
            className={cn(
              isMobileView
                ? "h-7 w-7 text-muted-foreground"
                : "h-5 w-5 text-foreground",
            )}
          />
        </button>

        {/* Date and counter */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-max max-w-[calc(100%-9rem)] -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="truncate text-sm font-medium">{formattedDate}</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {currentIndex + 1} of {totalPhotos}
          </p>
        </div>

        {/* Photo actions */}
        <div
          className="flex items-center gap-1 -mr-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {!isMobileView && (
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
                    <div className="group absolute left-3 flex gap-1.5">
                      <button
                        type="button"
                        aria-label="Close photo information"
                        onClick={closeInfo}
                        className="relative flex h-2.5 w-2.5 items-center justify-center rounded-full bg-muted-foreground/30 transition-colors can-hover:group-hover:bg-[#FF5F57] focus-visible:bg-[#FF5F57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A7CFF]"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 10 10"
                          className="h-2 w-2 text-black/55 opacity-0 transition-opacity can-hover:group-hover:opacity-100 group-focus-within:opacity-100"
                          fill="currentColor"
                        >
                          <path d="M2.2 1.4 5 4.2l2.8-2.8.8.8L5.8 5l2.8 2.8-.8.8L5 5.8 2.2 8.6l-.8-.8L4.2 5 1.4 2.2z" />
                        </svg>
                      </button>
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"
                      />
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"
                      />
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

                    <CameraDetails
                      metadata={metadata}
                      isLoading={isMetadataLoading}
                      hasError={metadataError}
                      filename={photo.filename}
                      variant="desktop"
                    />

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
          )}

          <button
            onClick={() => onToggleFavorite?.(photo.id)}
            onMouseDown={(e) => e.stopPropagation()}
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
            onClick={rotateLeft}
            className="p-1 rounded text-foreground transition-colors can-hover:hover:bg-muted"
            aria-label="Rotate left"
            title="Rotate Left"
          >
            <RotateCcwSquare
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      <div
        ref={mobileScrollRef}
        className={cn(
          "flex-1 min-h-0 bg-background",
          isMobileView ? "overflow-y-auto" : "overflow-hidden"
        )}
      >
        {/* Photo with horizontal swipe navigation and native vertical reveal on mobile */}
        <div
          {...swipeHandlers}
          className={cn(
            "flex h-full items-center justify-center bg-muted/30",
            isMobileView && "touch-pan-y"
          )}
        >
          <div
            ref={imageContainerRef}
            className="relative h-full w-full overflow-hidden overscroll-x-none"
          >
            <div ref={gestureTrackRef} className="absolute inset-0">
              {slideIndexes.map((slideIndex) => {
                const slidePhoto = photos[slideIndex];
                const slideRotation = photoRotations[slidePhoto.id] ?? 0;
                const displayedSize = getDisplayedImageSize(
                  slidePhoto.id,
                  slideRotation,
                );
                const isCurrentSlide = slideIndex === currentIndex;

                return (
                  <div
                    key={slidePhoto.id}
                    aria-hidden={!isCurrentSlide}
                    className={cn(
                      "pointer-events-none absolute inset-0 flex items-center justify-center",
                      shouldAnimateSlides &&
                        "will-change-transform transition-transform motion-reduce:transition-none",
                    )}
                    style={{
                      transform: getPhotoSlideTransform(
                        slideIndex,
                        currentIndex,
                      ),
                      transitionDuration: shouldAnimateSlides
                        ? `${PHOTO_SLIDE_DURATION_MS}ms`
                        : undefined,
                      transitionTimingFunction: shouldAnimateSlides
                        ? PHOTO_SLIDE_EASING
                        : undefined,
                    }}
                  >
                    {displayedSize ? (
                      <Image
                        src={getViewerUrl(slidePhoto.url)}
                        alt=""
                        width={Math.max(
                          1,
                          Math.round(displayedSize.width),
                        )}
                        height={Math.max(
                          1,
                          Math.round(displayedSize.height),
                        )}
                        draggable={false}
                        style={{
                          width: displayedSize.width,
                          height: displayedSize.height,
                          transform: slideRotation
                            ? `rotate(${slideRotation}deg)`
                            : undefined,
                          transition:
                            isCurrentSlide && shouldAnimateRotation
                              ? "transform 0.2s ease-out"
                              : undefined,
                        }}
                        onLoad={(event) =>
                          handleImageLoad(
                            slidePhoto.id,
                            event.currentTarget,
                          )
                        }
                        priority={Math.abs(slideIndex - currentIndex) <= 1}
                        unoptimized
                      />
                    ) : (
                      <Image
                        src={getViewerUrl(slidePhoto.url)}
                        alt=""
                        fill
                        draggable={false}
                        className="object-contain"
                        style={{
                          transform: slideRotation
                            ? `rotate(${slideRotation}deg)`
                            : undefined,
                          transition:
                            isCurrentSlide && shouldAnimateRotation
                              ? "transform 0.2s ease-out"
                              : undefined,
                        }}
                        sizes="(max-width: 768px) 100vw, 80vw"
                        onLoad={(event) =>
                          handleImageLoad(
                            slidePhoto.id,
                            event.currentTarget,
                          )
                        }
                        priority={Math.abs(slideIndex - currentIndex) <= 1}
                        unoptimized
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {isMobileView && (
          <section
            id="mobile-photo-info"
            aria-label="Photo information"
            className="border-t border-muted-foreground/20 bg-background px-4 pb-16 pt-5"
          >
            <div className="mb-4">
              <time
                dateTime={photo.timestamp}
                className="block text-base font-medium leading-6"
              >
                {mobileFormattedDate}
              </time>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {photo.filename}
              </p>
            </div>

            <CameraDetails
              metadata={metadata}
              isLoading={isMetadataLoading}
              hasError={metadataError}
              filename={photo.filename}
              variant="mobile"
            />

            <dl className="mt-4 grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-xl bg-muted/70 px-3 py-3 text-sm">
              <dt className="text-muted-foreground">Favorite</dt>
              <dd>{photo.isFavorite ? "Yes" : "No"}</dd>
              <dt className="text-muted-foreground">Collections</dt>
              <dd className="min-w-0 break-words">
                {collectionNames.length > 0 ? collectionNames.join(", ") : "None"}
              </dd>
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
