"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Photo, Collection } from "@/types/photos";

const FAVORITES_STORAGE_KEY = "photosFavorites";

interface UsePhotosResult {
  photos: Photo[];
  collections: Collection[];
  loading: boolean;
  error: string | null;
  toggleFavorite: (photoId: string) => void;
  refetch: () => Promise<void>;
}

interface UsePhotosOptions {
  enabled?: boolean;
}

// Database row type (snake_case from Supabase)
interface PhotoRow {
  id: string;
  filename: string;
  url: string;
  timestamp: string;
  collections: string[];
}

// Static collections (these don't change often)
const COLLECTIONS: Collection[] = [
  { id: "flowers", name: "Flowers", coverPhotoId: "IMG_6282" },
  { id: "food", name: "Food", coverPhotoId: "IMG_7430" },
  { id: "friends", name: "Friends", coverPhotoId: "IMG_6537" },
];

// Load favorites from localStorage
function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

// Save favorites to localStorage
function saveFavorites(favorites: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
}

export function usePhotos(options?: UsePhotosOptions): UsePhotosResult {
  const enabled = options?.enabled ?? true;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error: fetchError } = await supabase.rpc("select_photos");

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Transform photos and merge with local favorites
      const currentFavorites = loadFavorites();
      const transformedPhotos = (data as PhotoRow[]).map((row): Photo => ({
        id: row.id,
        filename: row.filename,
        url: row.url,
        timestamp: row.timestamp,
        isFavorite: currentFavorites.has(row.id),
        collections: row.collections || [],
      }));

      setPhotos(transformedPhotos);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch photos";
      setError(message);
      console.error("Error fetching photos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchPhotos();
  }, [enabled, fetchPhotos]);

  const toggleFavorite = useCallback((photoId: string) => {
    const nextFavorites = loadFavorites();
    if (nextFavorites.has(photoId)) {
      nextFavorites.delete(photoId);
    } else {
      nextFavorites.add(photoId);
    }
    saveFavorites(nextFavorites);

    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId
          ? { ...photo, isFavorite: !photo.isFavorite }
          : photo
      )
    );
  }, []);

  return {
    photos,
    collections: COLLECTIONS,
    loading,
    error,
    toggleFavorite,
    refetch: fetchPhotos,
  };
}
