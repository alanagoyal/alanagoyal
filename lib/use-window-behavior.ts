"use client";

import { useState, useCallback, useEffect, useRef } from "react";

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
  windowRef: React.RefObject<HTMLDivElement | null>;
}

interface UseWindowBehaviorReturn {
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
  windowRef,
}: UseWindowBehaviorProps): UseWindowBehaviorReturn {
  // Single state toggle to attach/detach global listeners (2 re-renders per interaction)
  const [isInteracting, setIsInteracting] = useState(false);

  // All drag/resize data in refs — no re-renders during mousemove
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragSizeRef = useRef({ width: 0, height: 0 });
  const currentPosRef = useRef({ x: 0, y: 0 });

  const resizeDirRef = useRef<ResizeDirection>(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
  const currentSizeRef = useRef({ width: 0, height: 0 });
  const currentResizePosRef = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".window-controls")) return;
      if (isMaximized) return;

      e.preventDefault();
      onFocus?.();

      isDraggingRef.current = true;
      dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      dragSizeRef.current = { width: size.width, height: size.height };
      currentPosRef.current = { x: position.x, y: position.y };
      setIsInteracting(true);
    },
    [position, size, isMaximized, onFocus]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      if (isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus?.();

      resizeDirRef.current = direction;
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
        posX: position.x,
        posY: position.y,
      };
      currentSizeRef.current = { width: size.width, height: size.height };
      currentResizePosRef.current = { x: position.x, y: position.y };
      setIsInteracting(true);
    },
    [isMaximized, size, position, onFocus]
  );

  useEffect(() => {
    if (!isInteracting) return;

    const el = windowRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && el) {
        let newX = e.clientX - dragOffsetRef.current.x;
        let newY = e.clientY - dragOffsetRef.current.y;

        const minX = -(dragSizeRef.current.width - 100);
        const maxX = window.innerWidth - 100;
        const minY = MENU_BAR_HEIGHT;
        const maxY = window.innerHeight - DOCK_HEIGHT - 50;

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));

        currentPosRef.current = { x: newX, y: newY };
        el.style.transform = `translate(${newX}px, ${newY}px)`;
      } else if (resizeDirRef.current && el) {
        const dir = resizeDirRef.current;
        const start = resizeStartRef.current;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;

        let newWidth = start.width;
        let newHeight = start.height;
        let newX = start.posX;
        let newY = start.posY;

        if (dir.includes("e")) {
          const maxWidth = window.innerWidth - start.posX;
          newWidth = Math.max(minSize.width, Math.min(maxWidth, start.width + dx));
        } else if (dir.includes("w")) {
          const proposedWidth = start.width - dx;
          const maxLeftExpand = start.posX;
          const maxWidthFromLeft = start.width + maxLeftExpand;
          newWidth = Math.max(minSize.width, Math.min(maxWidthFromLeft, proposedWidth));
          newX = start.posX + (start.width - newWidth);
        }

        if (dir.includes("s")) {
          const maxHeight = window.innerHeight - DOCK_HEIGHT - start.posY;
          newHeight = Math.max(minSize.height, Math.min(maxHeight, start.height + dy));
        } else if (dir.includes("n")) {
          const proposedHeight = start.height - dy;
          const maxTopExpand = start.posY - MENU_BAR_HEIGHT;
          const maxHeightFromTop = start.height + maxTopExpand;
          newHeight = Math.max(minSize.height, Math.min(maxHeightFromTop, proposedHeight));
          newY = start.posY + (start.height - newHeight);
        }

        currentSizeRef.current = { width: newWidth, height: newHeight };
        currentResizePosRef.current = { x: newX, y: newY };

        el.style.transform = `translate(${newX}px, ${newY}px)`;
        el.style.width = `${newWidth}px`;
        el.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        onMove(currentPosRef.current);
      }
      if (resizeDirRef.current) {
        resizeDirRef.current = null;
        onResize(currentSizeRef.current, currentResizePosRef.current);
      }
      setIsInteracting(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isInteracting, windowRef, minSize, onMove, onResize]);

  return {
    handleDragStart,
    handleResizeStart,
  };
}

// Shared resize handle sizes
export const CORNER_SIZE = 12;
export const EDGE_SIZE = 6;
