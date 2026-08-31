export const CAMPAIGN_LEVEL_COUNT = 5;

export type CampaignLevel = 1 | 2 | 3 | 4 | 5;
export type CampaignGameId = "memory" | "minesweeper" | "breakout";

export interface MemoryLevelConfig {
  gridSize: number;
}

export interface MinesweeperLevelConfig {
  size: number;
  mineCount: number;
}

export interface BreakoutLevelConfig {
  rows: number;
  ballSpeed: number;
  paddleWidth: number;
}

export const MEMORY_LEVELS: readonly MemoryLevelConfig[] = [
  { gridSize: 4 },
  { gridSize: 5 },
  { gridSize: 6 },
  { gridSize: 7 },
  { gridSize: 8 },
];

export const MINESWEEPER_LEVELS: readonly MinesweeperLevelConfig[] = [
  { size: 6, mineCount: 5 },
  { size: 9, mineCount: 10 },
  { size: 12, mineCount: 20 },
  { size: 14, mineCount: 30 },
  { size: 16, mineCount: 40 },
];

export const BREAKOUT_LEVELS: readonly BreakoutLevelConfig[] = [
  { rows: 3, ballSpeed: 3.2, paddleWidth: 112 },
  { rows: 4, ballSpeed: 3.5, paddleWidth: 104 },
  { rows: 5, ballSpeed: 3.8, paddleWidth: 96 },
  { rows: 6, ballSpeed: 4.1, paddleWidth: 88 },
  { rows: 7, ballSpeed: 4.4, paddleWidth: 80 },
];

export function getCampaignConfig<T>(levels: readonly T[], level: CampaignLevel): T {
  const config = levels[level - 1];
  if (!config) throw new RangeError(`Missing configuration for campaign level ${level}.`);
  return config;
}

export function nextCampaignLevel(level: CampaignLevel): CampaignLevel | null {
  return level < CAMPAIGN_LEVEL_COUNT ? (level + 1) as CampaignLevel : null;
}

const STORAGE_KEY = "games-campaign-levels";
type StorageArea = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type SavedCampaignLevels = Partial<Record<CampaignGameId, CampaignLevel>>;

function getSessionStorage(storage?: StorageArea): StorageArea | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function isCampaignLevel(value: unknown): value is CampaignLevel {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= CAMPAIGN_LEVEL_COUNT;
}

export function loadCampaignLevel(game: CampaignGameId, storage?: StorageArea): CampaignLevel {
  const target = getSessionStorage(storage);
  if (!target) return 1;
  try {
    const saved = JSON.parse(target.getItem(STORAGE_KEY) ?? "{}") as SavedCampaignLevels;
    const level = saved[game];
    return isCampaignLevel(level) ? level : 1;
  } catch {
    return 1;
  }
}

export function saveCampaignLevel(game: CampaignGameId, level: CampaignLevel, storage?: StorageArea): void {
  const target = getSessionStorage(storage);
  if (!target) return;
  try {
    const saved = JSON.parse(target.getItem(STORAGE_KEY) ?? "{}") as SavedCampaignLevels;
    target.setItem(STORAGE_KEY, JSON.stringify({ ...saved, [game]: level }));
  } catch {
    // Ignore malformed or unavailable session storage.
  }
}

export function clearCampaignLevels(storage?: StorageArea): void {
  const target = getSessionStorage(storage);
  if (!target) return;
  try {
    target.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable session storage.
  }
}
