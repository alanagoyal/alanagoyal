export type DockSubmenuSide = "left" | "right";

interface DockSubmenuPlacement {
  menuLeft: number;
  menuRight: number;
  submenuWidth: number;
  viewportWidth: number;
  overlap?: number;
  viewportMargin?: number;
}

export function getDockSubmenuSide({
  menuLeft,
  menuRight,
  submenuWidth,
  viewportWidth,
  overlap = 4,
  viewportMargin = 8,
}: DockSubmenuPlacement): DockSubmenuSide {
  const rightOverflow = Math.max(
    0,
    menuRight - overlap + submenuWidth - (viewportWidth - viewportMargin)
  );
  const leftOverflow = Math.max(
    0,
    viewportMargin - (menuLeft + overlap - submenuWidth)
  );

  return leftOverflow < rightOverflow ? "left" : "right";
}
