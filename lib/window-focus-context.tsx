"use client";

import { createContext, useContext, RefObject } from "react";

interface WindowFocusContextValue {
  isFocused: boolean;
  appId: string;
  // Window control functions
  closeWindow: () => void;
  minimizeWindow: () => void;
  toggleMaximize: () => void;
  isMaximized: boolean;
  // Drag handler - call this onMouseDown to start dragging
  onDragStart: (e: React.MouseEvent) => void;
  // Container ref for dialogs - positioned at window bounds
  dialogContainerRef: RefObject<HTMLDivElement | null>;
}

const WindowFocusContext = createContext<WindowFocusContextValue | null>(null);

export function WindowFocusProvider({
  children,
  isFocused,
  appId,
  closeWindow,
  minimizeWindow,
  toggleMaximize,
  isMaximized,
  onDragStart,
  dialogContainerRef,
}: {
  children: React.ReactNode;
  isFocused: boolean;
  appId: string;
  closeWindow: () => void;
  minimizeWindow: () => void;
  toggleMaximize: () => void;
  isMaximized: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  dialogContainerRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <WindowFocusContext.Provider
      value={{
        isFocused,
        appId,
        closeWindow,
        minimizeWindow,
        toggleMaximize,
        isMaximized,
        onDragStart,
        dialogContainerRef,
      }}
    >
      {children}
    </WindowFocusContext.Provider>
  );
}

export function useWindowFocus(): WindowFocusContextValue | null {
  return useContext(WindowFocusContext);
}
