import type { ChessMoveRecord } from "@/lib/games/chess";

export const WAITING_FRESH_MS = 45_000;
export const PARTICIPANT_ACTIVE_MS = 180_000;
export const MATCHMAKING_TIMEOUT_MS = 120_000;

export interface GameMatch {
  id: string;
  status: "waiting" | "active" | "completed" | "expired";
  white_visitor_id: string;
  white_name: string;
  black_visitor_id: string | null;
  black_name: string | null;
  fen: string;
  pgn: string;
  move_history: ChessMoveRecord[];
  version: number;
  result: string | null;
  waiting_heartbeat_at: string | null;
  white_heartbeat_at: string;
  black_heartbeat_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface VisitorIdentity {
  id: string;
  secret: string;
}

const IDENTITY_KEY = "games-visitor-identity-v1";
const PLAYER_NAME_KEY = "games-player-name-v1";

export function normalizePlayerName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function isValidPlayerName(name: string) {
  const normalized = normalizePlayerName(name);
  return normalized.length >= 1 && normalized.length <= 20 && !/[\u0000-\u001f\u007f]/.test(normalized);
}

export function loadPlayerName() {
  if (typeof window === "undefined") return "";
  return normalizePlayerName(window.localStorage.getItem(PLAYER_NAME_KEY) ?? "");
}

export function savePlayerName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAYER_NAME_KEY, normalizePlayerName(name));
}

export function createVisitorIdentity(): VisitorIdentity {
  return { id: crypto.randomUUID(), secret: `${crypto.randomUUID()}${crypto.randomUUID()}` };
}

export function loadVisitorIdentity(): VisitorIdentity {
  if (typeof window === "undefined") return { id: "", secret: "" };
  try {
    const raw = window.localStorage.getItem(IDENTITY_KEY);
    if (raw) {
      const value = JSON.parse(raw) as Partial<VisitorIdentity>;
      if (typeof value.id === "string" && typeof value.secret === "string" && value.secret.length >= 32) {
        return { id: value.id, secret: value.secret };
      }
    }
  } catch { /* create a replacement */ }
  const identity = createVisitorIdentity();
  window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

export function isFreshWaitingMatch(match: Pick<GameMatch, "status" | "waiting_heartbeat_at" | "expires_at">, now = Date.now()) {
  if (match.status !== "waiting" || !match.waiting_heartbeat_at) return false;
  return now - Date.parse(match.waiting_heartbeat_at) <= WAITING_FRESH_MS && Date.parse(match.expires_at) > now;
}

export function participantIsActive(heartbeat: string | null, now = Date.now()) {
  return Boolean(heartbeat && now - Date.parse(heartbeat) <= PARTICIPANT_ACTIVE_MS);
}

export function getExpiredParticipant(match: Pick<GameMatch, "status" | "white_heartbeat_at" | "black_heartbeat_at">, now = Date.now()): "white" | "black" | null {
  if (match.status !== "active") return null;
  if (!participantIsActive(match.white_heartbeat_at, now)) return "white";
  if (!participantIsActive(match.black_heartbeat_at, now)) return "black";
  return null;
}
