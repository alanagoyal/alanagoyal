import { loadVisitorIdentity, type GameMatch, type VisitorIdentity } from "@/lib/games/matches";

interface GamesResponse { match?: GameMatch | null; waiting?: boolean; waitingName?: string | null; error?: string }

export interface WaitingPlayer {
  waiting: boolean;
  name: string | null;
}

async function request(action: string, identity: VisitorIdentity, body: Record<string, unknown> = {}) {
  const response = await fetch("/api/games/chess", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, visitorId: identity.id, visitorSecret: identity.secret, ...body }),
  });
  const payload = await response.json() as GamesResponse;
  if (!response.ok) throw new Error(payload.error || "Games service is unavailable.");
  return payload;
}

export const gamesApi = {
  resume: (identity: VisitorIdentity) => request("resume", identity),
  matchmake: (identity: VisitorIdentity, name: string) => request("matchmake", identity, { name }),
  get: (identity: VisitorIdentity, matchId: string) => request("get", identity, { matchId }),
  heartbeat: (identity: VisitorIdentity, matchId: string) => request("heartbeat", identity, { matchId }),
  cancelWaiting: (identity: VisitorIdentity, matchId: string, version: number) => request("cancelWaiting", identity, { matchId, version }),
  leave: (identity: VisitorIdentity, matchId: string) => request("leave", identity, { matchId }),
  move: (identity: VisitorIdentity, matchId: string, version: number, from: string, to: string, promotion = "q") =>
    request("move", identity, { matchId, version, from, to, promotion }),
};

export async function getWaitingPlayer(): Promise<WaitingPlayer> {
  const visitorId = typeof window === "undefined" ? "" : loadVisitorIdentity().id;
  const params = new URLSearchParams({ badge: "1" });
  if (visitorId) params.set("visitorId", visitorId);
  const response = await fetch(`/api/games/chess?${params}`, { cache: "no-store" });
  if (!response.ok) return { waiting: false, name: null };
  const payload = (await response.json()) as GamesResponse;
  return {
    waiting: Boolean(payload.waiting),
    name: typeof payload.waitingName === "string" ? payload.waitingName : null,
  };
}
