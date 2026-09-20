"use client";

import { useEffect, useMemo, useState } from "react";
import type { Photo, PhotosView } from "@/types/photos";
import { normalizePhotoSearchQuery } from "./search";

interface PhotoSearchResponse {
  results?: Array<{ id: string }>;
  error?: string;
  reranked?: boolean;
}

interface UsePhotoSearchResult {
  results: Photo[] | null;
  loading: boolean;
  error: string | null;
  reranked: boolean;
}

export function usePhotoSearch(
  query: string,
  activeView: PhotosView,
  photos: Photo[],
): UsePhotoSearchResult {
  const [resultIds, setResultIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reranked, setReranked] = useState(false);
  const normalizedQuery = normalizePhotoSearchQuery(query);

  useEffect(() => {
    if (!normalizedQuery) {
      setResultIds(null);
      setLoading(false);
      setError(null);
      setReranked(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setResultIds([]);
    const timeoutId = window.setTimeout(async () => {
      try {
        const collection = activeView !== "library" && activeView !== "favorites"
          ? activeView
          : null;
        const response = await fetch("/api/photos/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: normalizedQuery, collection }),
          signal: controller.signal,
        });
        const data = (await response.json()) as PhotoSearchResponse;
        if (!response.ok) throw new Error(data.error || "Search failed");
        setResultIds((data.results ?? []).map((result) => result.id));
        setReranked(Boolean(data.reranked));
      } catch (searchError) {
        if (controller.signal.aborted) return;
        setResultIds([]);
        setError(searchError instanceof Error ? searchError.message : "Search failed");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeView, normalizedQuery]);

  const results = useMemo(() => {
    if (resultIds === null) return null;
    const photoById = new Map(photos.map((photo) => [photo.id, photo]));
    return resultIds
      .map((id) => photoById.get(id))
      .filter((photo): photo is Photo => Boolean(photo))
      .filter((photo) => activeView !== "favorites" || photo.isFavorite);
  }, [activeView, photos, resultIds]);

  return { results, loading, error, reranked };
}
