"use client";

import { useState, useCallback, useEffect } from "react";

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | null;

// Layout constants
export const MENU_BAR_HEIGHT = 28;
export const DOCK_HEIGHT = 80;

interface UseWindowBehaviorProps {
  position: Position;
  size: Size;
  minSize?: Size;
  isMaximized: boolean;
  onMove: (position: Position) => void;
  onResize: (size: Size, position?: Position) => void;
  onFocus?: () => void;
}

interface UseWindowBehaviorReturn {
  isDragging: boolean;
  resizeDir: ResizeDirection;
  handleDragStart: (e: React.MouseEvent) => void;
  handleResizeStart: (e: React.MouseEvent, direction: ResizeDirection) => void;
}

export function useWindowBehavior({
  position,
  size,
  minSize = { width: 400, height: 300 },
  isMaximized,
  onMove,
  onResize,
  onFocus,
}: UseWindowBehaviorProps): UseWindowBehaviorReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDir, setResizeDir] = useState<ResizeDirection>(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
  });

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Don't drag if clicking on window controls
      if ((e.target as HTMLElement).closest(".window-controls")) return;
      if (isMaximized) return;

      e.preventDefault();
      onFocus?.();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [position, isMaximized, onFocus]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;

        // Constrain bounds
        const minX = -(size.width - 100);
        const maxX = window.innerWidth - 100;
        const minY = MENU_BAR_HEIGHT;
        const maxY = window.innerHeight - DOCK_HEIGHT - 50;

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));

        onMove({ x: newX, y: newY });
      } else if (resizeDir) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.posX;
        let newY = resizeStart.posY;

        // Handle horizontal resize
        if (resizeDir.includes("e")) {
          const maxWidth = window.innerWidth - resizeStart.posX;
          newWidth = Math.max(minSize.width, Math.min(maxWidth, resizeStart.width + dx));
        } else if (resizeDir.includes("w")) {
          const proposedWidth = resizeStart.width - dx;
          const maxLeftExpand = resizeStart.posX;
          const maxWidthFromLeft = resizeStart.width + maxLeftExpand;
          newWidth = Math.max(minSize.width, Math.min(maxWidthFromLeft, proposedWidth));
          newX = resizeStart.posX + (resizeStart.width - newWidth);
        }

        // Handle vertical resize
        if (resizeDir.includes("s")) {
          const maxHeight = window.innerHeight - DOCK_HEIGHT - resizeStart.posY;
          newHeight = Math.max(minSize.height, Math.min(maxHeight, resizeStart.height + dy));
        } else if (resizeDir.includes("n")) {
          const proposedHeight = resizeStart.height - dy;
          const maxTopExpand = resizeStart.posY - MENU_BAR_HEIGHT;
          const maxHeightFromTop = resizeStart.height + maxTopExpand;
          newHeight = Math.max(minSize.height, Math.min(maxHeightFromTop, proposedHeight));
          newY = resizeStart.posY + (resizeStart.height - newHeight);
        }

        onResize({ width: newWidth, height: newHeight }, { x: newX, y: newY });
      }
    },
    [isDragging, dragOffset, resizeDir, resizeStart, size.width, minSize, onMove, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setResizeDir(null);
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      if (isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus?.();
      setResizeDir(direction);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
        posX: position.x,
        posY: position.y,
      });
    },
    [isMaximized, size, position, onFocus]
  );

  // Attach global mouse listeners during drag/resize
  useEffect(() => {
    if (isDragging || resizeDir) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, resizeDir, handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    resizeDir,
    handleDragStart,
    handleResizeStart,
  };
}

// Shared resize handle sizes
export const CORNER_SIZE = 12;
export const EDGE_SIZE = 6;
