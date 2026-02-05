"use client";

import { useRef, useEffect, useLayoutEffect, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { WindowControls } from "@/components/window-controls";
import {
  useWindowBehavior,
  Position,
  Size,
  MENU_BAR_HEIGHT,
  DOCK_HEIGHT,
  CORNER_SIZE,
  EDGE_SIZE,
} from "@/lib/use-window-behavior";
import { MAXIMIZED_Z_INDEX, useWindowManager } from "@/lib/window-context";
import { getPdfProxyUrl } from "@/lib/preview-utils";

export type PreviewFileType = "image" | "pdf";

// Title bar height - exported for use in window size calculations
export const PREVIEW_TITLE_BAR_HEIGHT = 44;

interface PreviewWindowProps {
  filePath: string;
  fileUrl: string;
  fileType: PreviewFileType;
  position: Position;
  size: Size;
  zIndex: number;
  isFocused: boolean;
  isMaximized: boolean;
  initialZoom?: number;
  initialScrollLeft?: number;
  initialScrollTop?: number;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onMove: (position: Position) => void;
  onResize: (size: Size, position?: Position) => void;
  onZoomChange?: (zoom: number) => void;
  onScrollChange?: (scrollLeft: number, scrollTop: number) => void;
}

export function PreviewWindow({
  filePath,
  fileUrl,
  fileType,
  position,
  size,
  zIndex,
  isFocused,
  isMaximized,
  initialZoom = 1,
  initialScrollLeft = 0,
  initialScrollTop = 0,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  onZoomChange,
  onScrollChange,
}: PreviewWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileName = filePath?.split("/").pop() || "Untitled";
  const { isMenuOpenRef } = useWindowManager();
  const [zoom, setZoom] = useState(initialZoom);
  const [imageError, setImageError] = useState<"network" | "unknown" | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [pdfAttempt, setPdfAttempt] = useState(0);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isScrollRestored, setIsScrollRestored] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const pendingScrollRef = useRef<{ left: number; top: number } | null>(
    initialZoom > 1 ? { left: initialScrollLeft, top: initialScrollTop } : null
  );

  const { handleDragStart, handleResizeStart } = useWindowBehavior({
    position,
    size,
    minSize: { width: 400, height: 300 },
    isMaximized,
    onMove,
    onResize,
    onFocus,
  });

  // Track container size for responsive image fitting (debounced for smoothness)
  useEffect(() => {
    if (!containerRef.current) return;
    let timeoutId: NodeJS.Timeout;
    const updateSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }, 16); // ~60fps
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  // Calculate "fit" size - what the image would be at zoom=1 (contained within container)
  const getFitSize = useCallback(() => {
    if (!naturalSize || !containerSize) return null;
    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = naturalSize.width / naturalSize.height;

    if (imageAspect > containerAspect) {
      // Image is wider than container - fit to width
      return { width: containerSize.width, height: containerSize.width / imageAspect };
    } else {
      // Image is taller than container - fit to height
      return { width: containerSize.height * imageAspect, height: containerSize.height };
    }
  }, [naturalSize, containerSize]);

  // Store callbacks in refs to avoid stale closures
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;
  const onScrollChangeRef = useRef(onScrollChange);
  onScrollChangeRef.current = onScrollChange;

  // Restore scroll position when zoomed in content becomes ready
  useLayoutEffect(() => {
    if (isScrollRestored || zoom <= 1) return;
    if (!pendingScrollRef.current || !containerRef.current) return;
    const fitSize = getFitSize();
    if (!fitSize) return;

    containerRef.current.scrollLeft = pendingScrollRef.current.left;
    containerRef.current.scrollTop = pendingScrollRef.current.top;
    pendingScrollRef.current = null;
    setIsScrollRestored(true);
  }, [isScrollRestored, zoom, getFitSize]);

  // Persist scroll position when user scrolls (debounced)
  // Re-attaches listener when zoom changes to ensure correct zoom check
  useEffect(() => {
    const container = containerRef.current;
    if (!container || zoom <= 1) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onScrollChangeRef.current?.(container.scrollLeft, container.scrollTop);
      }, 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [zoom]);

  // Zoom controls - persist changes and clear scroll when returning to fit
  const zoomIn = useCallback(() => {
    setZoom((z) => {
      const newZoom = Math.min(z + 0.25, 5);
      setTimeout(() => onZoomChangeRef.current?.(newZoom), 0);
      return newZoom;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const newZoom = Math.max(z - 0.25, 0.25);
      setTimeout(() => {
        onZoomChangeRef.current?.(newZoom);
        if (newZoom === 1) onScrollChangeRef.current?.(0, 0);
      }, 0);
      return newZoom;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setTimeout(() => {
      onZoomChangeRef.current?.(1);
      onScrollChangeRef.current?.(0, 0);
    }, 0);
  }, []);

  // Pan handlers for drag-to-scroll when zoomed in
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    const fitSize = getFitSize();
    if (zoom <= 1 || !fitSize || !containerRef.current) return;

    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
    };
  }, [zoom, getFitSize]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !panStartRef.current || !containerRef.current) return;

    const deltaX = e.clientX - panStartRef.current.x;
    const deltaY = e.clientY - panStartRef.current.y;

    containerRef.current.scrollLeft = panStartRef.current.scrollLeft - deltaX;
    containerRef.current.scrollTop = panStartRef.current.scrollTop - deltaY;
  }, [isPanning]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return;

      if (e.key === "Escape") {
        (document.activeElement as HTMLElement)?.blur();
        return;
      }

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key.toLowerCase() === "q") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.metaKey || e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          zoomIn();
        } else if (e.key === "-") {
          e.preventDefault();
          zoomOut();
        } else if (e.key === "0") {
          e.preventDefault();
          resetZoom();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, onClose, zoomIn, zoomOut, resetZoom]);

  // Reset error/size/loading state when file changes (zoom is initialized from prop)
  useEffect(() => {
    setImageError(null);
    setPdfLoading(true);
    setPdfError(false);
    setPdfAttempt(0);
    setNaturalSize(null);
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

  const pdfProxyUrl = useMemo(() => getPdfProxyUrl(fileUrl), [fileUrl]);
  const pdfSrc = useMemo(() => `${pdfProxyUrl}&attempt=${pdfAttempt}`, [pdfProxyUrl, pdfAttempt]);

  const windowStyle = isMaximized
    ? { top: MENU_BAR_HEIGHT, left: 0, right: 0, bottom: DOCK_HEIGHT, width: "auto", height: "auto", zIndex: MAXIMIZED_Z_INDEX }
    : { top: position.y, left: position.x, width: size.width, height: size.height, zIndex };

  // Handle image load errors with network detection
  const handleImageError = useCallback(() => {
    // Check if likely a network error (offline or CORS)
    if (!navigator.onLine) {
      setImageError("network");
    } else {
      setImageError("unknown");
    }
  }, []);

  const renderContent = () => {
    if (fileType === "pdf") {
      if (pdfError) {
        return (
          <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
            <div className="text-center">
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
          {!isFocused && (
            <div
              className="absolute inset-0 z-10"
              onMouseDown={(event) => {
                event.preventDefault();
                onFocus();
              }}
              onClick={(event) => {
                event.preventDefault();
                onFocus();
              }}
            />
          )}
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
            tabIndex={0}
            onFocus={() => onFocus()}
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
          <div className="text-center">
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

    // At zoom=1, use pure CSS for smooth resizing
    // At other zoom levels, calculate explicit dimensions for scrollable area
    const fitSize = getFitSize();

    // For non-1 zoom, we need fitSize to calculate dimensions
    // Render image invisibly to load it and get naturalSize, then show once fitSize is ready
    const needsFitSize = zoom !== 1;
    if (needsFitSize && !fitSize) {
      return (
        <div ref={containerRef} className="w-full h-full relative">
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

    // Calculate explicit dimensions only when zoomed and fitSize is available
    const displayWidth = isZoomed ? fitSize!.width * zoom : undefined;
    const displayHeight = isZoomed ? fitSize!.height * zoom : undefined;

    return (
      <div
        ref={containerRef}
        className="w-full h-full select-none"
        style={{
          overflow: canPan ? "auto" : "hidden",
          cursor: canPan ? (isPanning ? "grabbing" : "grab") : "default",
        }}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        {/* Inner wrapper for centering and scroll area */}
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
      ref={windowRef}
      className={cn("fixed", !isFocused && !isMaximized && "opacity-95")}
      style={windowStyle}
      onMouseDownCapture={(e) => {
        if (isMenuOpenRef.current) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        onFocus();
      }}
      onClickCapture={(e) => {
        if (isMenuOpenRef.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      {/* Window chrome */}
      <div
        className={cn(
          "absolute inset-0 bg-zinc-100 dark:bg-zinc-900 overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 flex flex-col",
          isMaximized ? "rounded-none" : "rounded-xl",
          !isFocused && "[&_*]:!cursor-default"
        )}
      >
        {/* Title bar */}
        <div
          className="px-4 py-2 flex items-center justify-between select-none bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 cursor-default"
          onMouseDown={handleDragStart}
        >
          <WindowControls
            inShell={true}
            className="p-2 window-controls"
            onClose={onClose}
            onMinimize={onMinimize}
            onToggleMaximize={onToggleMaximize}
            isMaximized={isMaximized}
            closeLabel="Close window"
          />
          <div className="flex-1 text-center">
            <span className="text-zinc-600 dark:text-zinc-400 text-sm">{fileName}</span>
          </div>
          {/* Zoom controls for images - stopPropagation prevents window drag */}
          {fileType === "image" && (
            <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
              <button
                onClick={zoomOut}
                className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                title="Zoom out (Cmd -)"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35M8 11h6" />
                </svg>
              </button>
              <span className="text-zinc-600 dark:text-zinc-400 text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={zoomIn}
                className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                title="Zoom in (Cmd +)"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
                </svg>
              </button>
            </div>
          )}
          {fileType === "pdf" && <div className="w-[68px]" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 bg-zinc-100 dark:bg-zinc-900">
          {renderContent()}
        </div>
      </div>

      {/* Resize handles */}
      {!isMaximized && (
        <>
          <div
            className="absolute cursor-nw-resize"
            style={{ top: -3, left: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            className="absolute cursor-ne-resize"
            style={{ top: -3, right: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="absolute cursor-sw-resize"
            style={{ bottom: -3, left: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="absolute cursor-se-resize"
            style={{ bottom: -3, right: -3, width: CORNER_SIZE, height: CORNER_SIZE, zIndex: 20 }}
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
          <div
            className="absolute cursor-n-resize"
            style={{ top: -3, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            className="absolute cursor-s-resize"
            style={{ bottom: -3, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            className="absolute cursor-w-resize"
            style={{ left: -3, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
          <div
            className="absolute cursor-e-resize"
            style={{ right: -3, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
        </>
      )}
    </div>
  );
}
