import type { GameMatch, VisitorIdentity } from "@/lib/games/matches";

interface GamesResponse { match?: GameMatch; waiting?: boolean; error?: string }

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
  matchmake: (identity: VisitorIdentity) => request("matchmake", identity),
  get: (identity: VisitorIdentity, matchId: string) => request("get", identity, { matchId }),
  heartbeat: (identity: VisitorIdentity, matchId: string) => request("heartbeat", identity, { matchId }),
  leave: (identity: VisitorIdentity, matchId: string) => request("leave", identity, { matchId }),
  move: (identity: VisitorIdentity, matchId: string, version: number, from: string, to: string, promotion = "q") =>
    request("move", identity, { matchId, version, from, to, promotion }),
};

export async function getWaitingBadge(): Promise<boolean> {
  const response = await fetch("/api/games/chess?badge=1", { cache: "no-store" });
  if (!response.ok) return false;
  return Boolean(((await response.json()) as GamesResponse).waiting);
}
