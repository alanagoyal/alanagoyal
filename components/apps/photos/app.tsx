"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Sidebar } from "./sidebar";
import { PhotosGrid } from "./photos-grid";
import { PhotoViewer } from "./photo-viewer";
import { Nav } from "./nav";
import { PhotosHeader } from "./header";
import { Photo, PhotosView, TimeFilter } from "@/types/photos";
import { usePhotos } from "@/lib/photos/use-photos";
import {
  loadPhotosRotations,
  loadPhotosSelectedId,
  loadPhotosShowGrid,
  loadPhotosView,
  savePhotosRotations,
  savePhotosSelectedId,
  savePhotosShowGrid,
  savePhotosView,
} from "@/lib/sidebar-persistence";
import type { PhotoRotations } from "@/lib/sidebar-persistence";
import {
  loadPhotoGridSize,
  resizePhotoGrid,
  savePhotoGridSize,
  type PhotoGridResizeDirection,
  type PhotoGridSize,
} from "@/lib/photos/grid-size";

interface AppProps {
  isDesktop?: boolean;
  inShell?: boolean;
}

export default function App({ isDesktop = false }: AppProps) {
  // Fetch photos from Supabase
  const { photos, collections, loading, error, toggleFavorite } = usePhotos();
  const isMobileView = !isDesktop;

  // Load persisted view state (runs after hydration since page waits for isHydrated)
  const [activeView, setActiveView] = useState<PhotosView>(() => loadPhotosView() as PhotosView);
  const [isViewLoaded, setIsViewLoaded] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [photoGridSize, setPhotoGridSize] = useState<PhotoGridSize>("standard");
  const [isScrolled, setIsScrolled] = useState(false);
  // First-time mobile visitors open directly into Library. After that, preserve
  // whether the current tab was showing the sidebar or Photos content.
  const [showGrid, setShowGrid] = useState(
    () => loadPhotosSelectedId() !== null || loadPhotosShowGrid(),
  );
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(() => loadPhotosSelectedId());
  const [selectedInGridId, setSelectedInGridId] = useState<string | null>(null);
  const [photoRotations, setPhotoRotations] = useState<PhotoRotations>(() =>
    loadPhotosRotations(),
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Mark view as loaded after first render
  useEffect(() => {
    setIsViewLoaded(true);
    setPhotoGridSize(loadPhotoGridSize());
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

  useEffect(() => {
    if (isViewLoaded) {
      savePhotosShowGrid(showGrid);
    }
  }, [showGrid, isViewLoaded]);

  useEffect(() => {
    if (isViewLoaded) {
      savePhotosRotations(photoRotations);
    }
  }, [photoRotations, isViewLoaded]);

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
    setSelectedPhotoId(null);
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

  const handlePhotoGridResize = useCallback((direction: PhotoGridResizeDirection) => {
    setPhotoGridSize((currentSize) => {
      const nextSize = resizePhotoGrid(currentSize, direction);
      if (nextSize !== currentSize) savePhotoGridSize(nextSize);
      return nextSize;
    });
  }, []);

  const handleCloseViewer = useCallback(() => {
    setSelectedPhotoId(null);
  }, []);

  const handleRotatePhoto = useCallback((photoId: string) => {
    setPhotoRotations((currentRotations) => ({
      ...currentRotations,
      [photoId]: (currentRotations[photoId] ?? 0) - 90,
    }));
  }, []);

  // Get the selected photo and its index in the filtered list
  const selectedPhoto = selectedPhotoId
    ? filteredPhotos.find((p) => p.id === selectedPhotoId)
    : null;
  const selectedPhotoIndex = selectedPhoto
    ? filteredPhotos.findIndex((p) => p.id === selectedPhotoId)
    : -1;
  const selectedPhotoCollectionNames = selectedPhoto
    ? collections
        .filter((collection) => selectedPhoto.collections.includes(collection.id))
        .map((collection) => collection.name)
    : [];
  const isRestoringSelectedPhoto =
    selectedPhotoId !== null && loading && !selectedPhoto;

  const handlePreviousPhoto = useCallback(() => {
    setSelectedPhotoId((currentPhotoId) => {
      const currentIndex = filteredPhotos.findIndex(
        (currentPhoto) => currentPhoto.id === currentPhotoId,
      );
      if (currentIndex <= 0) return currentPhotoId;
      return filteredPhotos[currentIndex - 1].id;
    });
  }, [filteredPhotos]);

  const handleNextPhoto = useCallback(() => {
    setSelectedPhotoId((currentPhotoId) => {
      const currentIndex = filteredPhotos.findIndex(
        (currentPhoto) => currentPhoto.id === currentPhotoId,
      );
      if (currentIndex < 0 || currentIndex >= filteredPhotos.length - 1) {
        return currentPhotoId;
      }
      return filteredPhotos[currentIndex + 1].id;
    });
  }, [filteredPhotos]);

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
              showPhotosGrid && !selectedPhoto && !isRestoringSelectedPhoto
                ? "block"
                : "hidden"
            }`}
          >
            <PhotosGrid
              photos={filteredPhotos}
              loading={loading}
              error={error}
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
              gridSize={photoGridSize}
              onGridResize={handlePhotoGridResize}
              isMobileView={isMobileView}
              onBack={handleBack}
              activeView={activeView}
              collections={collections}
              isDesktop={isDesktop}
              onToggleFavorite={toggleFavorite}
              onPhotoSelect={handlePhotoSelect}
              photoRotations={photoRotations}
              onRotatePhoto={handleRotatePhoto}
              selectedInGridId={selectedInGridId}
              onGridSelect={handleGridSelect}
            />
          </div>

          {showPhotosGrid && isRestoringSelectedPhoto && (
            <div
              role="status"
              aria-label="Loading selected photo"
              className="flex-1 min-h-0 bg-background"
            >
              <PhotosHeader isMobileView={isMobileView} aria-hidden="true" />
            </div>
          )}

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
                photoRotations={photoRotations}
                onRotate={() => handleRotatePhoto(selectedPhoto.id)}
                collectionNames={selectedPhotoCollectionNames}
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
