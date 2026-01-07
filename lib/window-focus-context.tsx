"use client";

import { createContext, useContext } from "react";

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
}: {
  children: React.ReactNode;
  isFocused: boolean;
  appId: string;
  closeWindow: () => void;
  minimizeWindow: () => void;
  toggleMaximize: () => void;
  isMaximized: boolean;
  onDragStart: (e: React.MouseEvent) => void;
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
      }}
    >
      {children}
    </WindowFocusContext.Provider>
  );
}

export function useWindowFocus(): WindowFocusContextValue | null {
  return useContext(WindowFocusContext);
}
