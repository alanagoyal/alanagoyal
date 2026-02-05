"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { PreviewFileType } from "./preview-window";
import { getPdfProxyUrl } from "@/lib/preview-utils";

interface PreviewAppProps {
  isMobile?: boolean;
  filePath?: string;
  fileUrl?: string;
  fileType?: PreviewFileType;
}

export function PreviewApp({
  isMobile = false,
  filePath,
  fileUrl,
  fileType = "image",
}: PreviewAppProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileName = filePath?.split("/").pop() || "Untitled";

  const [zoom, setZoom] = useState(1);
  const [imageError, setImageError] = useState<"network" | "unknown" | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [pdfAttempt, setPdfAttempt] = useState(0);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  // Track container size for responsive image fitting
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    let timeoutId: NodeJS.Timeout;
    const updateSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (scrollContainerRef.current) {
          const rect = scrollContainerRef.current.getBoundingClientRect();
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }, 16);
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(scrollContainerRef.current);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  // Calculate "fit" size - what the image would be at zoom=1
  const getFitSize = useCallback(() => {
    if (!naturalSize || !containerSize) return null;
    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = naturalSize.width / naturalSize.height;

    if (imageAspect > containerAspect) {
      return { width: containerSize.width, height: containerSize.width / imageAspect };
    } else {
      return { width: containerSize.height * imageAspect, height: containerSize.height };
    }
  }, [naturalSize, containerSize]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.25, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.25, 0.25));
  }, []);

  // Pan handlers for drag-to-scroll when zoomed in
  const handlePanStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const fitSize = getFitSize();
    if (zoom <= 1 || !fitSize || !scrollContainerRef.current) return;

    e.preventDefault();
    setIsPanning(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    panStartRef.current = {
      x: clientX,
      y: clientY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop,
    };
  }, [zoom, getFitSize]);

  const handlePanMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning || !panStartRef.current || !scrollContainerRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - panStartRef.current.x;
    const deltaY = clientY - panStartRef.current.y;

    scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - deltaX;
    scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - deltaY;
  }, [isPanning]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  // Reset state when file changes
  useEffect(() => {
    setImageError(null);
    setPdfLoading(true);
    setPdfError(false);
    setPdfAttempt(0);
    setNaturalSize(null);
    setZoom(1);
  }, [filePath, fileUrl, fileType]);

  // Timeout for PDF loading - if it takes too long, show error with download link
  useEffect(() => {
    if (fileType !== "pdf" || !pdfLoading || pdfError) return;

    const timeoutId = setTimeout(() => {
      if (pdfLoading) {
        setPdfError(true);
        setPdfLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, [fileType, pdfLoading, pdfError, pdfAttempt, fileUrl]);

  const pdfProxyUrl = useMemo(() => (fileUrl ? getPdfProxyUrl(fileUrl) : ""), [fileUrl]);
  const pdfSrc = useMemo(() => (pdfProxyUrl ? `${pdfProxyUrl}&attempt=${pdfAttempt}` : ""), [pdfProxyUrl, pdfAttempt]);

  // Handle image load errors
  const handleImageError = useCallback(() => {
    if (!navigator.onLine) {
      setImageError("network");
    } else {
      setImageError("unknown");
    }
  }, []);

  // No file selected state
  if (!fileUrl) {
    return (
      <div
        className={cn(
          "flex flex-col bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white",
          isMobile ? "h-dvh w-full" : "h-full"
        )}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-zinc-500 dark:text-zinc-400">
            <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <p className="text-sm">No file selected</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (fileType === "pdf") {
      if (pdfError) {
        return (
          <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
            <div className="text-center px-4">
              <svg className="w-16 h-16 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <p className="font-medium">Unable to display PDF</p>
              <p className="text-sm mt-1 mb-3">The PDF viewer couldn&apos;t load this file</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setPdfError(false);
                    setPdfLoading(true);
                    setPdfAttempt((attempt) => attempt + 1);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                >
                  Retry
                </button>
                <a
                  href={pdfProxyUrl}
                  download={fileName}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </a>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors"
                >
                  Open Original
                </a>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="relative w-full h-full">
          {pdfLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
              <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                <span className="text-sm">Loading PDF...</span>
              </div>
            </div>
          )}
          <iframe
            key={pdfSrc}
            src={pdfSrc}
            className="w-full h-full border-0"
            title={fileName}
            onLoad={() => {
              setPdfLoading(false);
              setPdfError(false);
            }}
            onError={() => {
              setPdfLoading(false);
              setPdfError(true);
            }}
          />
        </div>
      );
    }

    if (imageError) {
      return (
        <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
          <div className="text-center px-4">
            <svg className="w-16 h-16 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
            <p className="font-medium">Unable to load image</p>
            <p className="text-sm mt-1">
              {imageError === "network"
                ? "Check your internet connection"
                : "The file may be missing or inaccessible"}
            </p>
          </div>
        </div>
      );
    }

    const fitSize = getFitSize();
    const needsFitSize = zoom !== 1;

    if (needsFitSize && !fitSize) {
      return (
        <div ref={scrollContainerRef} className="w-full h-full relative">
          <img
            src={fileUrl}
            alt=""
            className="absolute invisible"
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            }}
            onError={handleImageError}
          />
        </div>
      );
    }

    const isZoomed = zoom !== 1 && fitSize !== null;
    const canPan = isZoomed && zoom > 1;
    const displayWidth = isZoomed ? fitSize!.width * zoom : undefined;
    const displayHeight = isZoomed ? fitSize!.height * zoom : undefined;

    return (
      <div
        ref={scrollContainerRef}
        className="w-full h-full select-none"
        style={{
          overflow: canPan ? "auto" : "hidden",
          cursor: canPan ? (isPanning ? "grabbing" : "grab") : "default",
        }}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchStart={handlePanStart}
        onTouchMove={handlePanMove}
        onTouchEnd={handlePanEnd}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: canPan && displayWidth ? Math.max(displayWidth, containerSize?.width || 0) : "100%",
            height: canPan && displayHeight ? Math.max(displayHeight, containerSize?.height || 0) : "100%",
            minWidth: "100%",
            minHeight: "100%",
          }}
        >
          <img
            src={fileUrl}
            alt={fileName}
            draggable={false}
            className={isZoomed ? "" : "w-full h-full object-contain"}
            style={{
              width: displayWidth,
              height: displayHeight,
              flexShrink: isZoomed ? 0 : undefined,
              pointerEvents: "none",
              transition: isZoomed ? "width 0.15s ease-out, height 0.15s ease-out" : undefined,
            }}
            onError={handleImageError}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white overflow-hidden",
        isMobile ? "h-dvh w-full" : "h-full"
      )}
    >
      {/* Header bar */}
      <div className="px-4 py-3 flex items-center justify-between bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700">
        <div className="flex-1 text-center">
          <span className="text-zinc-600 dark:text-zinc-400 text-sm truncate">{fileName}</span>
        </div>
        {/* Zoom controls for images */}
        {fileType === "image" && (
          <div className="flex items-center gap-1">
            <button
              onClick={zoomOut}
              className="p-1.5 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
              title="Zoom out"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35M8 11h6" />
              </svg>
            </button>
            <span className="text-zinc-600 dark:text-zinc-400 text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
              title="Zoom in"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}
