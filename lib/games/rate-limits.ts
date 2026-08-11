export const GAMES_BADGE_REFRESH_MS = 60_000;

export const GAME_CHESS_ACTIONS = [
  "resume",
  "matchmake",
  "get",
  "heartbeat",
  "cancelWaiting",
  "leave",
  "move",
] as const;

export type GameChessAction = (typeof GAME_CHESS_ACTIONS)[number];

export interface DistributedGameRateLimit {
  scope: string;
  limit: number;
  windowSeconds: number;
}

interface GameActionRateLimitPolicy {
  distributedIp: DistributedGameRateLimit;
  identityLimit: number;
}

const STANDARD_API_IP_LIMIT: DistributedGameRateLimit = {
  scope: "games_chess_api_ip",
  limit: 600,
  windowSeconds: 60,
};

const ACTION_POLICIES: Record<GameChessAction, GameActionRateLimitPolicy> = {
  resume: { distributedIp: STANDARD_API_IP_LIMIT, identityLimit: 30 },
  matchmake: {
    distributedIp: {
      scope: "games_chess_matchmake_ip",
      limit: 30,
      windowSeconds: 60,
    },
    identityLimit: 10,
  },
  get: { distributedIp: STANDARD_API_IP_LIMIT, identityLimit: 90 },
  heartbeat: { distributedIp: STANDARD_API_IP_LIMIT, identityLimit: 20 },
  cancelWaiting: { distributedIp: STANDARD_API_IP_LIMIT, identityLimit: 10 },
  leave: { distributedIp: STANDARD_API_IP_LIMIT, identityLimit: 10 },
  move: { distributedIp: STANDARD_API_IP_LIMIT, identityLimit: 90 },
};

export const GAMES_BADGE_IP_RATE_LIMIT: DistributedGameRateLimit = {
  scope: "games_chess_badge_ip",
  limit: 120,
  windowSeconds: 60,
};

export function isGameChessAction(value: unknown): value is GameChessAction {
  return typeof value === "string" && GAME_CHESS_ACTIONS.includes(value as GameChessAction);
}

export function getGameActionRateLimitPolicy(action: GameChessAction) {
  return ACTION_POLICIES[action];
}
