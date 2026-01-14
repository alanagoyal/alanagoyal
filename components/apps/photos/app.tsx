"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Sidebar } from "./sidebar";
import { PhotosGrid } from "./photos-grid";
import { Nav } from "./nav";
import { Photo, Collection, PhotosView, TimeFilter } from "@/types/photos";
import { initialPhotos, initialCollections } from "@/data/photos/initial-photos";
import { useWindowFocus } from "@/lib/window-focus-context";

interface AppProps {
  isDesktop?: boolean;
  inShell?: boolean;
}

const STORAGE_KEY = "photosAppState";

export default function App({ isDesktop = false, inShell = false }: AppProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeView, setActiveView] = useState<PhotosView>("library");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLayoutInitialized, setIsLayoutInitialized] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const windowFocus = useWindowFocus();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved state with initial photos
        const mergedPhotos = initialPhotos.map((photo) => {
          const savedPhoto = parsed.photos?.find((p: { id: string }) => p.id === photo.id);
          if (savedPhoto) {
            return {
              ...photo,
              isFavorite: savedPhoto.isFavorite ?? photo.isFavorite,
              collections: savedPhoto.collections ?? photo.collections,
            };
          }
          return photo;
        });
        setPhotos(mergedPhotos);
        setCollections(parsed.collections ?? initialCollections);
      } catch {
        setPhotos(initialPhotos);
        setCollections(initialCollections);
      }
    } else {
      setPhotos(initialPhotos);
      setCollections(initialCollections);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (photos.length > 0) {
      const stateToSave = {
        photos: photos.map((p) => ({
          id: p.id,
          isFavorite: p.isFavorite,
          collections: p.collections,
        })),
        collections,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [photos, collections]);

  // Mobile view detection
  useEffect(() => {
    if (!isDesktop) {
      setIsMobileView(true);
      setIsLayoutInitialized(true);
      return;
    }

    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    setIsLayoutInitialized(true);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDesktop]);

  // Filter photos based on active view
  const filteredPhotos = useMemo(() => {
    if (activeView === "library") {
      return photos;
    }
    if (activeView === "favorites") {
      return photos.filter((p) => p.isFavorite);
    }
    // Collection view
    return photos.filter((p) => p.collections.includes(activeView));
  }, [photos, activeView]);

  const handleViewSelect = useCallback((view: PhotosView) => {
    setActiveView(view);
    setShowGrid(true);
  }, []);

  const handleBack = useCallback(() => {
    setShowGrid(false);
  }, []);

  if (!isLayoutInitialized) {
    return <div className="h-full bg-background" />;
  }

  // Mobile: show either sidebar or grid
  // Desktop: show both side by side
  const showSidebar = !isMobileView || !showGrid;
  const showPhotosGrid = !isMobileView || showGrid;

  return (
    <div
      ref={containerRef}
      data-app="photos"
      tabIndex={-1}
      className="flex h-full relative outline-none overflow-hidden"
    >
      <main className="h-full w-full bg-background flex flex-col overflow-hidden">
        <div className="flex-1 flex min-h-0">
          {/* Sidebar */}
          <div
            className={`h-full flex-shrink-0 overflow-hidden ${
              showSidebar
                ? isMobileView
                  ? "block w-full"
                  : "block w-[220px] border-r dark:border-foreground/20"
                : "hidden"
            }`}
          >
            <Sidebar
              collections={collections}
              activeView={activeView}
              onViewSelect={handleViewSelect}
              isMobileView={isMobileView}
              onScroll={setIsScrolled}
            >
              <Nav
                isMobileView={isMobileView}
                isScrolled={isScrolled}
                isDesktop={isDesktop}
              />
            </Sidebar>
          </div>

          {/* Photos Grid */}
          <div
            className={`flex-1 min-h-0 overflow-hidden ${
              showPhotosGrid ? "block" : "hidden"
            }`}
          >
            <PhotosGrid
              photos={filteredPhotos}
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
              isMobileView={isMobileView}
              onBack={handleBack}
              activeView={activeView}
              collections={collections}
              isDesktop={isDesktop}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
