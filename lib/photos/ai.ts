import "server-only";

import OpenAI from "openai";
import {
  PHOTO_EMBEDDING_DIMENSIONS,
  buildPhotoSearchDocument,
  normalizePhotoAnalysis,
  type PhotoSearchMetadata,
} from "./search";

export const PHOTO_COLLECTIONS = ["flowers", "food", "friends"] as const;

export interface PhotoAnalysis {
  caption: string;
  tags: string[];
  ocrText: string;
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
              caption: { type: "string" },
              tags: {
                type: "array",
                items: { type: "string" },
              },
              ocr_text: { type: "string" },
              collections: {
                type: "array",
                items: { type: "string", enum: [...PHOTO_COLLECTIONS] },
              },
            },
            required: ["caption", "tags", "ocr_text", "collections"],
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

Describe only visible details. Include the main subjects, setting, activity, objects, colors, food, plants, weather, and photographic context when useful. Transcribe clearly visible text into ocr_text. Use concise, concrete search tags. Do not identify unknown people or infer sensitive traits.

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

export async function createPhotoEmbedding(metadata: PhotoSearchMetadata): Promise<number[] | null> {
  const client = getOpenAIClient();
  if (!client) return null;
  const input = buildPhotoSearchDocument(metadata);
  if (!input) return null;

  try {
    const response = await client.embeddings.create({
      model: process.env.PHOTO_EMBEDDING_MODEL || "text-embedding-3-small",
      input,
      dimensions: PHOTO_EMBEDDING_DIMENSIONS,
      encoding_format: "float",
    });
    return response.data[0]?.embedding ?? null;
  } catch (error) {
    console.error("Photo embedding failed:", error);
    return null;
  }
}

export async function analyzeAndEmbedPhoto(
  imageUrl: string,
  baseMetadata: Pick<PhotoSearchMetadata, "filename" | "collections" | "timestamp">,
): Promise<{ analysis: PhotoAnalysis; embedding: number[] | null } | null> {
  const analysis = await analyzePhoto(imageUrl);
  if (!analysis) return null;
  const collections = baseMetadata.collections.length > 0
    ? baseMetadata.collections
    : analysis.collections;
  const embedding = await createPhotoEmbedding({
    ...baseMetadata,
    collections,
    caption: analysis.caption,
    tags: analysis.tags,
    ocrText: analysis.ocrText,
  });
  return { analysis: { ...analysis, collections }, embedding };
}
