export function getEveningFocusEndTime(now = new Date()): number | null {
  const evening = new Date(now);
  evening.setHours(19, 0, 0, 0);

  return evening.getTime() > now.getTime() ? evening.getTime() : null;
}
