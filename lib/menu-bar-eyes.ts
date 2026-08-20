export type EyeStyleId = "googly" | "cat" | "dragon";

export interface EyeStyle {
  id: EyeStyleId;
  /** Shown in the button's accessible name, e.g. "Googly eyes". */
  label: string;
  sclera: string;
  iris: string | null;
  irisRadius: number;
  pupil: string;
  /** Round pupils read as googly; a slit reads as cat or dragon. */
  pupilShape: "round" | "slit";
  pupilRadius: number;
  /** A brow line above each eye, drawn only when set. */
  brow: string | null;
}

export const EYE_STYLES: readonly EyeStyle[] = [
  {
    id: "googly",
    label: "Googly eyes",
    sclera: "#ffffff",
    iris: null,
    irisRadius: 0,
    pupil: "#111111",
    pupilShape: "round",
    pupilRadius: 3.1,
    brow: null,
  },
  {
    id: "cat",
    label: "Cat eyes",
    sclera: "#fde68a",
    iris: "#f59e0b",
    irisRadius: 5.0,
    pupil: "#1c1917",
    pupilShape: "slit",
    pupilRadius: 3.8,
    brow: null,
  },
  {
    id: "dragon",
    label: "Dragon eyes",
    sclera: "#fca5a5",
    iris: "#dc2626",
    irisRadius: 5.0,
    pupil: "#18181b",
    pupilShape: "slit",
    pupilRadius: 3.8,
    brow: "#7f1d1d",
  },
];

export const EYE_STYLE_STORAGE_KEY = "desktop-menu-bar-eyes-style";

export function getEyeStyle(id: EyeStyleId): EyeStyle {
  return EYE_STYLES.find((style) => style.id === id) ?? EYE_STYLES[0];
}

export function nextEyeStyle(id: EyeStyleId): EyeStyleId {
  const index = EYE_STYLES.findIndex((style) => style.id === id);
  return EYE_STYLES[(index + 1) % EYE_STYLES.length].id;
}

export function parseStoredEyeStyle(value: string | null): EyeStyleId | null {
  if (!value) return null;
  return EYE_STYLES.some((style) => style.id === value) ? (value as EyeStyleId) : null;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * How far the pupil sits from the centre of its socket, given where the
 * pointer is. The pupil tracks direction exactly but its distance is capped,
 * so it slides to the edge of the eye and stays there rather than escaping.
 */
export function pupilOffset(eyeCenter: Point, pointer: Point, maxOffset: number): Point {
  const dx = pointer.x - eyeCenter.x;
  const dy = pointer.y - eyeCenter.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || maxOffset <= 0) return { x: 0, y: 0 };
  const scale = Math.min(distance, maxOffset) / distance;
  return { x: dx * scale, y: dy * scale };
}
