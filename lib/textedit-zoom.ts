export const TEXTEDIT_ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200] as const;

export function getTextEditZoom(value: unknown): number {
  return typeof value === "number" && TEXTEDIT_ZOOM_LEVELS.some((level) => level === value)
    ? value
    : 100;
}
