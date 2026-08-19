const FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})/;
const ATX_HEADING_PATTERN = /^ {0,3}(#{1,6})(?:[\t ]+|$)/;

export function getPrimaryCollapsibleHeadingLevel(
  markdown: string,
): number | null {
  const headingCounts = new Map<number, number>();
  let activeFence: { marker: string; length: number } | null = null;

  for (const line of markdown.split("\n")) {
    const fenceMatch = line.match(FENCE_PATTERN);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const marker = fence[0];

      if (!activeFence) {
        activeFence = { marker, length: fence.length };
      } else if (
        marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      }
      continue;
    }

    if (activeFence) continue;

    const headingMatch = line.match(ATX_HEADING_PATTERN);
    if (!headingMatch) continue;

    const level = headingMatch[1].length;
    headingCounts.set(level, (headingCounts.get(level) ?? 0) + 1);
  }

  for (let level = 1; level <= 6; level += 1) {
    if ((headingCounts.get(level) ?? 0) >= 2) return level;
  }

  for (let level = 1; level <= 6; level += 1) {
    if (headingCounts.has(level)) return level;
  }

  return null;
}
