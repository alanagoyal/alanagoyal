"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface RecentFile {
  path: string;
  name: string;
  type: "file" | "dir" | "app";
  accessedAt: number;
}

interface RecentsContextValue {
  recents: RecentFile[];
  addRecent: (file: Omit<RecentFile, "accessedAt">) => void;
  clearRecents: () => void;
}

const RecentsContext = createContext<RecentsContextValue | null>(null);

const STORAGE_KEY = "finder-recents";
const MAX_RECENTS = 20;

export function RecentsProvider({ children }: { children: React.ReactNode }) {
  const [recents, setRecents] = useState<RecentFile[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load recents from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Validate each item has required fields
            const valid = parsed.filter(
              (item): item is RecentFile =>
                typeof item.path === "string" &&
                typeof item.name === "string" &&
                typeof item.type === "string" &&
                typeof item.accessedAt === "number"
            );
            setRecents(valid);
          }
        }
      } catch (e) {
        console.error("Failed to load recents:", e);
      }
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage when recents change (after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recents));
    }
  }, [recents, isHydrated]);

  const addRecent = useCallback((file: Omit<RecentFile, "accessedAt">) => {
    setRecents(prev => {
      // If file is already in recents, don't move it (avoid jarring reorder)
      if (prev.some(r => r.path === file.path)) {
        return prev;
      }
      // Add new entry at the beginning with current timestamp
      const newRecent: RecentFile = {
        ...file,
        accessedAt: Date.now(),
      };
      // Keep only MAX_RECENTS items
      return [newRecent, ...prev].slice(0, MAX_RECENTS);
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
  }, []);

  return (
    <RecentsContext.Provider value={{ recents, addRecent, clearRecents }}>
      {children}
    </RecentsContext.Provider>
  );
}

export function useRecents(): RecentsContextValue {
  const context = useContext(RecentsContext);
  if (!context) {
    throw new Error("useRecents must be used within a RecentsProvider");
  }
  return context;
}
