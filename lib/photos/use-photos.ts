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

export function usePhotos(): UsePhotosResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
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
      setFavorites(currentFavorites);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch photos";
      setError(message);
      console.error("Error fetching photos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const toggleFavorite = useCallback((photoId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      saveFavorites(next);
      return next;
    });

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
