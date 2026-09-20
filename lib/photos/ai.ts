import "server-only";

import OpenAI from "openai";
import { normalizePhotoAnalysis } from "./search";

export const PHOTO_COLLECTIONS = ["flowers", "food", "friends"] as const;

export interface PhotoAnalysis {
  searchText: string;
  collections: string[];
}

let openAIClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey, timeout: 12_000, maxRetries: 1 });
  }
  return openAIClient;
}

export function isPhotoAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function analyzePhoto(imageUrl: string): Promise<PhotoAnalysis | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const response = await client.chat.completions.create({
      model: process.env.PHOTO_ANALYSIS_MODEL || "gpt-4o-mini",
      temperature: 0,
      max_tokens: 350,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "photo_search_metadata",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              search_text: { type: "string" },
              collections: {
                type: "array",
                items: { type: "string", enum: [...PHOTO_COLLECTIONS] },
              },
            },
            required: ["search_text", "collections"],
          },
        },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Create metadata that will make this personal photo easy to find later.

Write one concise search_text description using only visible details. Include the main subjects, setting, activity, objects, colors, food, plants, weather, and clearly visible text when useful. Add concrete alternative words someone might search for. Do not identify unknown people or infer sensitive traits.

Choose zero or one collection: flowers, food, or friends. Use friends for people or social gatherings. Return an empty collections array when none fits.`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "low" },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    const normalized = normalizePhotoAnalysis(JSON.parse(content), PHOTO_COLLECTIONS);
    return normalized ? { ...normalized } : null;
  } catch (error) {
    console.error("Photo analysis failed:", error);
    return null;
  }
}
