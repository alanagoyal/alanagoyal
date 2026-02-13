import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Create a Supabase client with service role for uploads
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, serviceRoleKey);
}

// Available collections for categorization
const COLLECTIONS = ["flowers", "food", "friends"] as const;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB decoded
const MAX_FILENAME_LENGTH = 255;
const COLLECTION_SET = new Set<string>(COLLECTIONS);

type ParsedImagePayload = {
  base64Data: string;
  contentType: string;
  extension: string;
};

function estimateBase64DecodedBytes(base64Data: string): number {
  const padding = base64Data.endsWith("==")
    ? 2
    : base64Data.endsWith("=")
      ? 1
      : 0;
  return Math.floor((base64Data.length * 3) / 4) - padding;
}

function parseImagePayload(image: string): ParsedImagePayload | null {
  const trimmed = image.trim();
  const dataUrlMatch = trimmed.match(
    /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\r\n]+)$/i
  );

  if (dataUrlMatch) {
    const subtype = dataUrlMatch[1].toLowerCase();
    const base64Data = dataUrlMatch[2].replace(/\s+/g, "");
    if (!base64Data) return null;
    if (subtype === "png") {
      return { base64Data, contentType: "image/png", extension: "png" };
    }
    if (subtype === "webp") {
      return { base64Data, contentType: "image/webp", extension: "webp" };
    }
    return { base64Data, contentType: "image/jpeg", extension: "jpeg" };
  }

  // Fallback for plain base64 payloads (assume JPEG).
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(trimmed)) return null;
  const base64Data = trimmed.replace(/\s+/g, "");
  if (!base64Data) return null;

  return { base64Data, contentType: "image/jpeg", extension: "jpeg" };
}

function isValidFilename(filename: string): boolean {
  return (
    filename.length > 0 &&
    filename.length <= MAX_FILENAME_LENGTH &&
    /^[A-Za-z0-9._-]+$/.test(filename)
  );
}

function normalizeCollections(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;

  const normalized: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const candidate = item.trim().toLowerCase();
    if (!COLLECTION_SET.has(candidate)) return null;
    if (!normalized.includes(candidate)) {
      normalized.push(candidate);
    }
  }

  return normalized;
}

// Use OpenAI Vision to categorize the image
async function categorizeImage(base64Image: string): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, skipping categorization");
    return [];
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and determine which single category best describes it. The available categories are: flowers, food, friends (photos of people/social gatherings).

Choose ONLY ONE category - the one that best fits the primary subject of the image.
Return ONLY the category name as a string, e.g. "flowers" or "food" or "friends".
If no categories match, return "none".
Do not include any other text, just the category name.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 20,
    });

    let content = response.choices[0]?.message?.content?.trim() || "none";

    // Strip markdown code blocks and quotes if present
    content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    content = content.replace(/^["']|["']$/g, "").toLowerCase();

    // Return as array with single category if valid, otherwise empty
    if (COLLECTIONS.includes(content as typeof COLLECTIONS[number])) {
      return [content];
    }
    return [];
  } catch (error) {
    console.error("Error categorizing image:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.PHOTOS_UPLOAD_API_KEY;

    if (!expectedKey) {
      return NextResponse.json(
        { error: "Server configuration error: API key not set" },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid API key" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;

    const image =
      typeof payload.image === "string" ? payload.image : null;

    const timestamp =
      typeof payload.timestamp === "string" ? payload.timestamp.trim() : null;

    const filename =
      typeof payload.filename === "string" ? payload.filename.trim() : null;

    const collections = normalizeCollections(payload.collections);

    if (!image) {
      return NextResponse.json(
        { error: "Missing required field: image (base64)" },
        { status: 400 }
      );
    }

    if (!timestamp) {
      return NextResponse.json(
        { error: "Missing required field: timestamp" },
        { status: 400 }
      );
    }

    if (collections === null) {
      return NextResponse.json(
        { error: "collections must be an array of: flowers, food, friends" },
        { status: 400 }
      );
    }

    const parsedImage = parseImagePayload(image);
    if (!parsedImage) {
      return NextResponse.json(
        { error: "Invalid image payload. Expected base64 image data." },
        { status: 400 }
      );
    }

    const estimatedBytes = estimateBase64DecodedBytes(parsedImage.base64Data);
    if (!Number.isFinite(estimatedBytes) || estimatedBytes <= 0) {
      return NextResponse.json(
        { error: "Invalid image payload. Decoded image is empty." },
        { status: 400 }
      );
    }
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds 10MB size limit" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(parsedImage.base64Data, "base64");
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "Invalid image payload. Decoded image is empty." },
        { status: 400 }
      );
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds 10MB size limit" },
        { status: 400 }
      );
    }

    // Parse timestamp to ensure valid format
    // If timestamp has no timezone info, assume it's Pacific time (America/Los_Angeles)
    let timestampStr = timestamp;

    // Check if timestamp already has timezone info (Z, +, or -)
    const hasTimezone = /([Zz]|[+-]\d{2}:?\d{2})$/.test(timestampStr);
    if (!hasTimezone) {
      // Determine if the date falls in PDT (daylight) or PST (standard)
      // PDT: Second Sunday of March to First Sunday of November
      const tempDate = new Date(timestampStr);
      const year = tempDate.getFullYear();
      const month = tempDate.getMonth();
      const day = tempDate.getDate();

      // Calculate second Sunday of March
      const marchFirst = new Date(year, 2, 1);
      const marchFirstDay = marchFirst.getDay();
      const secondSundayMarch = 8 + (7 - marchFirstDay) % 7;

      // Calculate first Sunday of November
      const novFirst = new Date(year, 10, 1);
      const novFirstDay = novFirst.getDay();
      const firstSundayNov = 1 + (7 - novFirstDay) % 7;

      // Check if in DST (PDT) - between second Sunday of March and first Sunday of November
      const isDST = (month > 2 && month < 10) ||
                    (month === 2 && day >= secondSundayMarch) ||
                    (month === 10 && day < firstSundayNov);

      // PDT is -07:00, PST is -08:00
      timestampStr = timestampStr + (isDST ? "-07:00" : "-08:00");
    }

    const photoTimestamp = new Date(timestampStr);
    if (isNaN(photoTimestamp.getTime())) {
      return NextResponse.json(
        { error: "Invalid timestamp format" },
        { status: 400 }
      );
    }

    if (filename && !isValidFilename(filename)) {
      return NextResponse.json(
        {
          error:
            "Invalid filename. Use letters, numbers, dot, underscore, or hyphen only.",
        },
        { status: 400 }
      );
    }

    // Generate filename if not provided
    const finalFilename = filename || `IMG_${Date.now()}.${parsedImage.extension}`;
    const storagePath = finalFilename;

    // Get Supabase client with service role
    const supabase = getServiceClient();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(storagePath, buffer, {
        contentType: parsedImage.contentType,
        cacheControl: "31536000", // 1 year cache
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("photos")
      .getPublicUrl(uploadData.path);

    // Use AI to categorize the image if no collections provided
    const detectedCollections = collections.length > 0
      ? collections
      : await categorizeImage(parsedImage.base64Data);

    // Insert metadata into database using RPC
    const { data: photoId, error: insertError } = await supabase.rpc(
      "insert_photo",
      {
        filename_arg: finalFilename,
        url_arg: publicUrl,
        timestamp_arg: photoTimestamp.toISOString(),
        collections_arg: detectedCollections,
      }
    );

    if (insertError) {
      console.error("Database insert error:", insertError);
      // Try to clean up uploaded file
      await supabase.storage.from("photos").remove([storagePath]);
      return NextResponse.json(
        { error: `Database insert failed: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: photoId,
      url: publicUrl,
      filename: finalFilename,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
