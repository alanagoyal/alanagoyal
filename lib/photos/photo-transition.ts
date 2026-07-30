export const PHOTO_SLIDE_DURATION_MS = 180;
export const PHOTO_SLIDE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const PHOTO_SLIDE_GUTTER_PX = 16;
const PHOTO_BOUNDARY_RESISTANCE = 0.18;
const PHOTO_BOUNDARY_MAX_OFFSET_PX = 24;
const PHOTO_WHEEL_TRACKING_GAIN = 0.55;
const PHOTO_TOUCH_SWIPE_VELOCITY = 0.5;

export type PhotoNavigationDirection = "previous" | "next";
export type PhotoNavigationSource = "keyboard" | "touch" | "wheel";
export type PhotoGestureSource = Exclude<
  PhotoNavigationSource,
  "keyboard"
>;

export function getPhotoSlideTransform(relativeIndex: number): string {
  if (relativeIndex === 0) {
    return "translate3d(var(--photo-drag-x), 0, 0)";
  }

  const percentage = relativeIndex * 100;
  const gutter =
    relativeIndex > 0
      ? `+ ${PHOTO_SLIDE_GUTTER_PX}px`
      : `- ${PHOTO_SLIDE_GUTTER_PX}px`;

  return `translate3d(calc(${percentage}% ${gutter} + var(--photo-drag-x)), 0, 0)`;
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
  const isBeyondBoundary =
    (deltaX > 0 && !canGoPrevious) || (deltaX < 0 && !canGoNext);

  if (isBeyondBoundary) {
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
  const maxOffset = Math.max(
    PHOTO_BOUNDARY_MAX_OFFSET_PX,
    viewportWidth * (source === "wheel" ? 0.2 : 0.45),
  );

  return Math.max(-maxOffset, Math.min(maxOffset, adjustedDeltaX));
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
    120,
    Math.max(72, viewportWidth * 0.2),
  );

  return (
    distance >= requiredDistance ||
    (distance >= 36 && velocity >= PHOTO_TOUCH_SWIPE_VELOCITY)
  );
}
