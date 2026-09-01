export const PHOTO_GRID_SIZES = ["compact", "standard", "comfortable"] as const;

export type PhotoGridSize = (typeof PHOTO_GRID_SIZES)[number];
export type PhotoGridResizeDirection = "smaller" | "larger";

interface PhotoGridStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const PHOTO_GRID_SIZE_KEY = "photos-grid-size";

function isPhotoGridSize(value: string | null): value is PhotoGridSize {
  return PHOTO_GRID_SIZES.includes(value as PhotoGridSize);
}

function getPhotoGridStorage(storage?: PhotoGridStorage): PhotoGridStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadPhotoGridSize(storage?: PhotoGridStorage): PhotoGridSize {
  try {
    const storedSize =
      getPhotoGridStorage(storage)?.getItem(PHOTO_GRID_SIZE_KEY) ?? null;
    return isPhotoGridSize(storedSize) ? storedSize : "standard";
  } catch {
    return "standard";
  }
}

export function savePhotoGridSize(
  size: PhotoGridSize,
  storage?: PhotoGridStorage,
): void {
  try {
    getPhotoGridStorage(storage)?.setItem(PHOTO_GRID_SIZE_KEY, size);
  } catch {
    // Keep the in-memory preference when browser storage is unavailable.
  }
}

export function resizePhotoGrid(
  size: PhotoGridSize,
  direction: PhotoGridResizeDirection,
): PhotoGridSize {
  const currentIndex = PHOTO_GRID_SIZES.indexOf(size);
  const nextIndex = direction === "smaller" ? currentIndex - 1 : currentIndex + 1;
  return PHOTO_GRID_SIZES[
    Math.max(0, Math.min(PHOTO_GRID_SIZES.length - 1, nextIndex))
  ];
}

export function getPhotoGridColumnClassName(
  size: PhotoGridSize,
  isMobileView: boolean,
): string {
  if (isMobileView) {
    return "grid-cols-3";
  }

  return {
    compact: "grid-cols-6",
    standard: "grid-cols-5",
    comfortable: "grid-cols-4",
  }[size];
}
