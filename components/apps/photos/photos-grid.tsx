"use client";

import { useMemo, useLayoutEffect, useRef, useState } from "react";
import { Photo, TimeFilter, PhotosView, Collection } from "@/types/photos";
import { ChevronLeft, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { toZonedTime } from "date-fns-tz";
import { format, parseISO } from "date-fns";
import Image from "next/image";

// Preload full-size image on hover for faster viewer loading
function preloadImage(url: string) {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.src = url;
}

interface PhotosGridProps {
  photos: Photo[];
  loading?: boolean;
  error?: string | null;
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  isMobileView: boolean;
  onBack: () => void;
  activeView: PhotosView;
  collections: Collection[];
  isDesktop?: boolean;
  onToggleFavorite?: (photoId: string) => void;
  onPhotoSelect?: (photoId: string) => void;
  selectedInGridId?: string | null;
  onGridSelect?: (photoId: string | null) => void;
}

export function PhotosGrid({
  photos,
  loading = false,
  error = null,
  timeFilter,
  onTimeFilterChange,
  isMobileView,
  onBack,
  activeView,
  collections,
  isDesktop = false,
  onToggleFavorite,
  onPhotoSelect,
  selectedInGridId,
  onGridSelect,
}: PhotosGridProps) {
  const windowFocus = useWindowFocus();
  const inShell = isDesktop && windowFocus;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPositioned, setIsPositioned] = useState(false);
  const prevPhotosRef = useRef<Photo[]>();

  // Scroll to bottom only if content overflows, otherwise stay at top
  // useLayoutEffect ensures scroll happens before paint to prevent flash
  useLayoutEffect(() => {
    // Reset positioning when photos array changes (e.g., switching views)
    if (photos !== prevPhotosRef.current) {
      setIsPositioned(false);
      prevPhotosRef.current = photos;
    }

    if (photos.length > 0 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (container.scrollHeight > container.clientHeight) {
        container.scrollTop = container.scrollHeight;
      }
      setIsPositioned(true);
    }
  }, [photos]);

  const groupedPhotos = useMemo(() => {
    // Photos are already sorted oldest first from parent
    if (timeFilter === "all") {
      return { all: photos };
    }

    const groups: Record<string, Photo[]> = {};
    photos.forEach((photo) => {
      const pstDate = toZonedTime(parseISO(photo.timestamp), "America/Los_Angeles");
      const key =
        timeFilter === "years"
          ? format(pstDate, "yyyy")
          : format(pstDate, "MMMM yyyy");

      if (!groups[key]) groups[key] = [];
      groups[key].push(photo);
    });

    return groups;
  }, [photos, timeFilter]);

  const dateRange = useMemo(() => {
    if (photos.length === 0) return "";
    // Photos are sorted oldest first
    const earliest = toZonedTime(parseISO(photos[0].timestamp), "America/Los_Angeles");
    const latest = toZonedTime(parseISO(photos[photos.length - 1].timestamp), "America/Los_Angeles");
    const earliestStr = format(earliest, "MMM d, yyyy");
    const latestStr = format(latest, "MMM d, yyyy");
    return earliestStr === latestStr ? earliestStr : `${earliestStr} - ${latestStr}`;
  }, [photos]);

  const getViewTitle = () => {
    if (activeView === "library") return "Library";
    if (activeView === "favorites") return "Favorites";
    const collection = collections.find((c) => c.id === activeView);
    return collection?.name || "Photos";
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div
        className={cn(
          "px-4 py-3 flex items-center justify-between border-b dark:border-foreground/20 select-none",
          isMobileView ? "bg-background" : "bg-muted/50"
        )}
        onMouseDown={inShell && !isMobileView ? windowFocus.onDragStart : undefined}
      >
        <div className="flex items-center gap-2">
          {isMobileView && (
            <button
              onClick={onBack}
              className="flex items-center text-[#0A84FF] hover:text-[#0A84FF]/80 -ml-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-semibold">{getViewTitle()}</h1>
            {dateRange && (
              <p className="text-xs text-muted-foreground">{dateRange}</p>
            )}
          </div>
        </div>

        {/* Time Filter Toggle - hidden on mobile */}
        {!isMobileView && (
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            {(["years", "months", "all"] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => onTimeFilterChange(filter)}
                className={cn(
                  "px-3 py-1 text-xs rounded-md transition-colors capitalize",
                  timeFilter === filter
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter === "all" ? "All Photos" : filter}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photo Grid */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-y-auto",
          !isPositioned && photos.length > 0 && "opacity-0"
        )}
      >
        <div className="p-4" onClick={() => onGridSelect?.(null)}>
          {error ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              Failed to load photos
            </div>
          ) : !loading && photos.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No photos
            </div>
          ) : (
            Object.entries(groupedPhotos).map(([group, groupPhotos]) => (
              <div key={group} className="mb-6">
                {timeFilter !== "all" && (
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                    {group}
                  </h2>
                )}
                <div
                  className={cn(
                    "grid gap-2",
                    isMobileView
                      ? "grid-cols-3"
                      : "grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  )}
                >
                  {groupPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={cn(
                        "aspect-square relative cursor-pointer rounded-sm",
                        !isMobileView && selectedInGridId === photo.id && "ring-[3px] ring-[#0A84FF]"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isMobileView) {
                          // Mobile: single tap opens viewer
                          onPhotoSelect?.(photo.id);
                        } else {
                          // Desktop: single click selects
                          onGridSelect?.(photo.id);
                        }
                      }}
                      onDoubleClick={() => {
                        // Desktop: double click opens viewer
                        if (!isMobileView) {
                          onPhotoSelect?.(photo.id);
                        }
                      }}
                      onMouseEnter={() => preloadImage(photo.url)}
                    >
                      <div className="relative w-full h-full overflow-hidden bg-muted group rounded-sm">
                        <Image
                          src={photo.url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 16vw"
                        />
                        {/* Favorite heart button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite?.(photo.id);
                          }}
                          className={cn(
                            "absolute bottom-1 left-1 p-0.5 rounded-full transition-opacity",
                            photo.isFavorite
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <Heart
                            className={cn(
                              "w-4 h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
                              photo.isFavorite
                                ? "fill-white text-white"
                                : "text-white"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
