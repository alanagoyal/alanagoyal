import "server-only";

import type { PhotoSearchCandidate } from "./search";

const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const JEV_TIMEOUT_MS = 8_000;
const MAX_CANDIDATES = 250;

function boundedText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

interface JevResponse {
  answers?: Record<string, { type?: string; noul?: number }>;
}

export function isJevConfigured(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY);
}

export async function scorePhotoCandidatesWithJev(
  query: string,
  candidates: PhotoSearchCandidate[],
): Promise<Map<string, number>> {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey || candidates.length === 0) return new Map();

  const shortlist = candidates.slice(0, MAX_CANDIDATES);
  const questions = Object.fromEntries(
    shortlist.map((_, index) => [
      `candidate_${index}`,
      {
        type: "noul",
        instructions: `Photo candidate ${index} satisfies the user's search. A direct visual match should score near 1; an unrelated photo should score near 0. Use filename, collection, and date only as supporting evidence.`,
      },
    ]),
  );
  const state = JSON.stringify({
    query,
    candidates: shortlist.map((candidate, index) => ({
      index,
      description: boundedText(candidate.searchText, 600),
      filename: boundedText(candidate.filename, 255),
      collections: candidate.collections.slice(0, 10),
      captured_at: candidate.timestamp,
    })),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), JEV_TIMEOUT_MS);
  try {
    const response = await fetch(JEV_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state,
        model: process.env.TYPESAFE_MODEL || "jev-latest",
        questions,
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Jev returned HTTP ${response.status}`);
    }
    const data = (await response.json()) as JevResponse;
    const scores = new Map<string, number>();
    shortlist.forEach((candidate, index) => {
      const score = data.answers?.[`candidate_${index}`]?.noul;
      if (typeof score === "number" && Number.isFinite(score)) {
        scores.set(candidate.id, score);
      }
    });
    return scores;
  } catch (error) {
    console.warn("Jev photo ranking unavailable; using text matching:", error);
    return new Map();
  } finally {
    clearTimeout(timeoutId);
  }
}
