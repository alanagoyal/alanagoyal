"use client";

import { useMemo } from "react";
import { Photo, TimeFilter, PhotosView, Collection } from "@/types/photos";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { format, parseISO } from "date-fns";
import Image from "next/image";

interface PhotosGridProps {
  photos: Photo[];
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  isMobileView: boolean;
  onBack: () => void;
  activeView: PhotosView;
  collections: Collection[];
  isDesktop?: boolean;
}

export function PhotosGrid({
  photos,
  timeFilter,
  onTimeFilterChange,
  isMobileView,
  onBack,
  activeView,
  collections,
  isDesktop = false,
}: PhotosGridProps) {
  const windowFocus = useWindowFocus();
  const inShell = isDesktop && windowFocus;

  const groupedPhotos = useMemo(() => {
    const sorted = [...photos].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (timeFilter === "all") {
      return { all: sorted };
    }

    const groups: Record<string, Photo[]> = {};
    sorted.forEach((photo) => {
      const date = parseISO(photo.timestamp);
      const key =
        timeFilter === "years"
          ? format(date, "yyyy")
          : format(date, "MMMM yyyy");

      if (!groups[key]) groups[key] = [];
      groups[key].push(photo);
    });

    return groups;
  }, [photos, timeFilter]);

  const dateRange = useMemo(() => {
    if (photos.length === 0) return "";
    const sorted = [...photos].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const earliest = parseISO(sorted[0].timestamp);
    const latest = parseISO(sorted[sorted.length - 1].timestamp);
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
          "px-4 py-3 flex items-center justify-between border-b dark:border-foreground/20",
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

        {/* Time Filter Toggle */}
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
      </div>

      {/* Photo Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {photos.length === 0 ? (
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
                    "grid gap-0.5",
                    isMobileView
                      ? "grid-cols-3"
                      : "grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  )}
                >
                  {groupPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square relative overflow-hidden bg-muted"
                    >
                      <Image
                        src={`/photos/${photo.filename}`}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 16vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
