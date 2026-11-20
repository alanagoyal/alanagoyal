export interface DockMagnificationItem {
  id: string;
  width: number;
  magnifies?: boolean;
}

// Use resting widths, never animated DOM bounds: magnification must not move
// the centers used to calculate the next frame's magnification.
export function getDockMagnificationScales(
  items: DockMagnificationItem[],
  gap: number,
  pointerOffset: number,
  iconSize: number,
): Record<string, number> {
  const width = items.reduce((total, item) => total + item.width, 0)
    + Math.max(0, items.length - 1) * gap;
  let left = -width / 2;
  const scales: Record<string, number> = {};
  const radius = iconSize * 0.88;
  for (const item of items) {
    if (item.magnifies !== false) {
      const distance = pointerOffset - (left + item.width / 2);
      scales[item.id] = 1 + 0.4 * Math.exp(
        -(distance * distance) / (2 * radius * radius),
      );
    }
    left += item.width + gap;
  }
  return scales;
}
