export const PHOTO_SLIDE_DURATION_MS = 240;
export const PHOTO_SWIPE_CANCEL_DURATION_MS = 160;
export const PHOTO_SLIDE_GUTTER_PX = 16;
export const PHOTO_SLIDE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
export const PHOTO_SWIPE_SETTLE_IDLE_MS = 90;
export const PHOTO_TOUCH_SWIPE_MIN_DISTANCE_PX = 72;
export const PHOTO_TOUCH_SWIPE_MAX_DISTANCE_PX = 120;
export const PHOTO_TOUCH_SWIPE_MIN_FLICK_PX = 36;
export const PHOTO_TOUCH_SWIPE_VELOCITY = 0.5;

const PHOTO_SLIDE_WINDOW_RADIUS = 2;
const PHOTO_BOUNDARY_RESISTANCE = 0.18;
const PHOTO_BOUNDARY_MAX_OFFSET_PX = 24;
const PHOTO_WHEEL_TRACKING_GAIN = 0.55;
const PHOTO_WHEEL_MAX_VIEWPORT_RATIO = 0.2;
const PHOTO_TOUCH_MAX_VIEWPORT_RATIO = 0.45;
const PHOTO_TOUCH_SWIPE_VIEWPORT_RATIO = 0.2;

export type PhotoNavigationDirection = "previous" | "next";
export type PhotoNavigationSource = "keyboard" | "touch" | "wheel";
export type PhotoGestureSource = Exclude<
  PhotoNavigationSource,
  "keyboard"
>;

export function getPhotoSlideIndexes(
  currentIndex: number,
  totalPhotos: number,
): number[] {
  const start = Math.max(0, currentIndex - PHOTO_SLIDE_WINDOW_RADIUS);
  const end = Math.min(
    totalPhotos - 1,
    currentIndex + PHOTO_SLIDE_WINDOW_RADIUS,
  );

  if (currentIndex < 0 || totalPhotos <= 0 || start > end) return [];

  return Array.from({ length: end - start + 1 }, (_, offset) => {
    return start + offset;
  });
}

export function getPhotoSlideTransform(
  photoIndex: number,
  currentIndex: number,
): string {
  const relativeIndex = photoIndex - currentIndex;
  if (relativeIndex === 0) return "translate3d(0, 0, 0)";

  const percentage = relativeIndex * 100;
  const gutter = Math.abs(relativeIndex) * PHOTO_SLIDE_GUTTER_PX;
  const offset =
    relativeIndex > 0
      ? `calc(${percentage}% + ${gutter}px)`
      : `calc(${percentage}% - ${gutter}px)`;

  return `translate3d(${offset}, 0, 0)`;
}

export function getPhotoGestureOffset({
  deltaX,
  viewportWidth,
  canGoPrevious,
  canGoNext,
  source,
}: {
  deltaX: number;
  viewportWidth: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  source: PhotoGestureSource;
}): number {
  const isPullingPastStart = deltaX > 0 && !canGoPrevious;
  const isPullingPastEnd = deltaX < 0 && !canGoNext;

  if (isPullingPastStart || isPullingPastEnd) {
    return (
      Math.sign(deltaX) *
      Math.min(
        Math.abs(deltaX) * PHOTO_BOUNDARY_RESISTANCE,
        PHOTO_BOUNDARY_MAX_OFFSET_PX,
      )
    );
  }

  const adjustedDeltaX =
    source === "wheel" ? deltaX * PHOTO_WHEEL_TRACKING_GAIN : deltaX;
  const maxViewportRatio =
    source === "wheel"
      ? PHOTO_WHEEL_MAX_VIEWPORT_RATIO
      : PHOTO_TOUCH_MAX_VIEWPORT_RATIO;
  const maxOffset = Math.max(
    PHOTO_BOUNDARY_MAX_OFFSET_PX,
    viewportWidth * maxViewportRatio,
  );

  return Math.max(
    -maxOffset,
    Math.min(maxOffset, adjustedDeltaX),
  );
}

export function shouldCommitTouchPhotoSwipe({
  distance,
  velocity,
  viewportWidth,
}: {
  distance: number;
  velocity: number;
  viewportWidth: number;
}): boolean {
  const requiredDistance = Math.min(
    PHOTO_TOUCH_SWIPE_MAX_DISTANCE_PX,
    Math.max(
      PHOTO_TOUCH_SWIPE_MIN_DISTANCE_PX,
      viewportWidth * PHOTO_TOUCH_SWIPE_VIEWPORT_RATIO,
    ),
  );

  return (
    distance >= requiredDistance ||
    (distance >= PHOTO_TOUCH_SWIPE_MIN_FLICK_PX &&
      velocity >= PHOTO_TOUCH_SWIPE_VELOCITY)
  );
}

export function shouldAnimatePhotoNavigation(
  source: PhotoNavigationSource,
  prefersReducedMotion: boolean,
): boolean {
  return source !== "keyboard" && !prefersReducedMotion;
}
