"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Sidebar } from "./sidebar";
import { PhotosGrid } from "./photos-grid";
import { PhotoViewer } from "./photo-viewer";
import { Nav } from "./nav";
import { Photo, PhotosView, TimeFilter } from "@/types/photos";
import { usePhotos } from "@/lib/photos/use-photos";
import { useWindowFocus } from "@/lib/window-focus-context";
import { loadPhotosView, savePhotosView, loadPhotosSelectedId, savePhotosSelectedId } from "@/lib/sidebar-persistence";

interface AppProps {
  isDesktop?: boolean;
  inShell?: boolean;
}

export default function App({ isDesktop = false, inShell = false }: AppProps) {
  // Fetch photos from Supabase
  const { photos, collections, loading, error, toggleFavorite } = usePhotos();

  // Load persisted view state (runs after hydration since page waits for isHydrated)
  const [activeView, setActiveView] = useState<PhotosView>(() => loadPhotosView() as PhotosView);
  const [isViewLoaded, setIsViewLoaded] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLayoutInitialized, setIsLayoutInitialized] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  // If there's a selected photo, show the grid (needed for mobile to display viewer)
  const [showGrid, setShowGrid] = useState(() => loadPhotosSelectedId() !== null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(() => loadPhotosSelectedId());
  const [selectedInGridId, setSelectedInGridId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const windowFocus = useWindowFocus();

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

  // Mark view as loaded after first render
  useEffect(() => {
    setIsViewLoaded(true);
  }, []);

  // Persist active view (only after initial load to avoid overwriting with default)
  useEffect(() => {
    if (isViewLoaded) {
      savePhotosView(activeView);
    }
  }, [activeView, isViewLoaded]);

  // Persist selected photo
  useEffect(() => {
    if (isViewLoaded) {
      savePhotosSelectedId(selectedPhotoId);
    }
  }, [selectedPhotoId, isViewLoaded]);

  // Filter and sort photos based on active view (oldest first, newest at bottom)
  const filteredPhotos = useMemo(() => {
    let filtered: Photo[];
    if (activeView === "library") {
      filtered = photos;
    } else if (activeView === "favorites") {
      filtered = photos.filter((p) => p.isFavorite);
    } else {
      // Collection view
      filtered = photos.filter((p) => p.collections.includes(activeView));
    }
    // Sort oldest first so newest photos appear at bottom (like Messages)
    return [...filtered].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [photos, activeView]);

  const handleViewSelect = useCallback((view: PhotosView) => {
    setActiveView(view);
    setShowGrid(true);
  }, []);

  const handleBack = useCallback(() => {
    setShowGrid(false);
  }, []);

  const handlePhotoSelect = useCallback((photoId: string) => {
    setSelectedPhotoId(photoId);
    setSelectedInGridId(null); // Clear grid selection when opening viewer
    // Focus the container so keyboard navigation works immediately
    containerRef.current?.focus();
  }, []);

  const handleGridSelect = useCallback((photoId: string | null) => {
    setSelectedInGridId(photoId);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setSelectedPhotoId(null);
  }, []);

  // Get the selected photo and its index in the filtered list
  const selectedPhoto = selectedPhotoId
    ? filteredPhotos.find((p) => p.id === selectedPhotoId)
    : null;
  const selectedPhotoIndex = selectedPhoto
    ? filteredPhotos.findIndex((p) => p.id === selectedPhotoId)
    : -1;

  const handlePreviousPhoto = useCallback(() => {
    if (selectedPhotoIndex > 0) {
      setSelectedPhotoId(filteredPhotos[selectedPhotoIndex - 1].id);
    }
  }, [selectedPhotoIndex, filteredPhotos]);

  const handleNextPhoto = useCallback(() => {
    if (selectedPhotoIndex < filteredPhotos.length - 1) {
      setSelectedPhotoId(filteredPhotos[selectedPhotoIndex + 1].id);
    }
  }, [selectedPhotoIndex, filteredPhotos]);

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

          {/* Photos Grid - always mounted to preserve scroll */}
          <div
            className={`flex-1 min-h-0 overflow-hidden ${
              showPhotosGrid && !selectedPhoto ? "block" : "hidden"
            }`}
          >
            <PhotosGrid
              photos={filteredPhotos}
              loading={loading}
              error={error}
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
              isMobileView={isMobileView}
              onBack={handleBack}
              activeView={activeView}
              collections={collections}
              isDesktop={isDesktop}
              onToggleFavorite={toggleFavorite}
              onPhotoSelect={handlePhotoSelect}
              selectedInGridId={selectedInGridId}
              onGridSelect={handleGridSelect}
            />
          </div>

          {/* Photo Viewer */}
          {selectedPhoto && showPhotosGrid && (
            <div className="flex-1 min-h-0 overflow-hidden">
              <PhotoViewer
                photo={selectedPhoto}
                photos={filteredPhotos}
                currentIndex={selectedPhotoIndex}
                totalPhotos={filteredPhotos.length}
                onBack={handleCloseViewer}
                onPrevious={handlePreviousPhoto}
                onNext={handleNextPhoto}
                onToggleFavorite={toggleFavorite}
                isMobileView={isMobileView}
                isDesktop={isDesktop}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
