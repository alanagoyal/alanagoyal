import "server-only";

import type { PhotoSearchCandidate } from "./search";

const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const JEV_TIMEOUT_MS = 4_000;

function boundedText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function boundedList(values: string[], maxItems: number): string[] {
  return values.slice(0, maxItems).map((value) => boundedText(value, 80)).filter(Boolean);
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

  const shortlist = candidates.slice(0, 20);
  const questions = Object.fromEntries(
    shortlist.map((_, index) => [
      `candidate_${index}`,
      {
        type: "noul",
        instructions: `Candidate ${index} is a strong visual match for the user's photo search. Judge visible subject matter and scene first; use filename or collection only as supporting evidence.`,
      },
    ]),
  );
  const state = JSON.stringify({
    query,
    candidates: shortlist.map((candidate, index) => ({
      index,
      caption: boundedText(candidate.caption, 600),
      tags: boundedList(candidate.tags, 24),
      visible_text: boundedText(candidate.ocrText, 1_000),
      filename: boundedText(candidate.filename, 255),
      collections: boundedList(candidate.collections, 10),
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
    console.warn("Jev photo reranking unavailable; using vector order:", error);
    return new Map();
  } finally {
    clearTimeout(timeoutId);
  }
}
