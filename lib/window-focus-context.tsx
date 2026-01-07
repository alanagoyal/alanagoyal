"use client";

import { createContext, useContext } from "react";

interface WindowFocusContextValue {
  isFocused: boolean;
  appId: string;
}

const WindowFocusContext = createContext<WindowFocusContextValue | null>(null);

export function WindowFocusProvider({
  children,
  isFocused,
  appId,
}: {
  children: React.ReactNode;
  isFocused: boolean;
  appId: string;
}) {
  return (
    <WindowFocusContext.Provider value={{ isFocused, appId }}>
      {children}
    </WindowFocusContext.Provider>
  );
}

export function useWindowFocus(): WindowFocusContextValue | null {
  return useContext(WindowFocusContext);
}
