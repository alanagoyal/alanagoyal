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

// Use OpenAI Vision to categorize the image
async function categorizeImage(base64Image: string): Promise<string[]> {
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
              text: `Analyze this image and determine which categories it belongs to. The available categories are: flowers, food, friends (photos of people/social gatherings).

Return ONLY a JSON array of matching categories, e.g. ["flowers"] or ["food", "friends"] or [].
If no categories match, return an empty array [].
Do not include any other text, just the JSON array.`,
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
      max_tokens: 50,
    });

    let content = response.choices[0]?.message?.content?.trim() || "[]";

    // Strip markdown code blocks if present
    content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    const categories = JSON.parse(content) as string[];

    // Filter to only valid collections
    return categories.filter((c) => COLLECTIONS.includes(c as typeof COLLECTIONS[number]));
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

    // Parse request body
    const body = await request.json();
    const { image, timestamp, filename, collections } = body;

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

    // Decode base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Detect image type from base64 header or default to jpeg
    let contentType = "image/jpeg";
    let extension = "jpeg";

    if (image.startsWith("data:image/png")) {
      contentType = "image/png";
      extension = "png";
    } else if (image.startsWith("data:image/webp")) {
      contentType = "image/webp";
      extension = "webp";
    }

    // Generate filename if not provided
    const finalFilename = filename || `IMG_${Date.now()}.${extension}`;
    const storagePath = finalFilename;

    // Get Supabase client with service role
    const supabase = getServiceClient();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(storagePath, buffer, {
        contentType,
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

    // Parse timestamp to ensure valid format
    // If timestamp has no timezone info, assume it's PST (America/Los_Angeles)
    let timestampStr = timestamp as string;

    // Check if timestamp already has timezone info (Z, +, or -)
    const hasTimezone = /([Zz]|[+-]\d{2}:?\d{2})$/.test(timestampStr);
    if (!hasTimezone) {
      // Append PST offset (-08:00 standard, -07:00 daylight)
      // Use -08:00 as default; iOS sends local time which is what we want to preserve
      timestampStr = timestampStr + "-08:00";
    }

    const photoTimestamp = new Date(timestampStr);
    if (isNaN(photoTimestamp.getTime())) {
      return NextResponse.json(
        { error: "Invalid timestamp format" },
        { status: 400 }
      );
    }

    // Use AI to categorize the image if no collections provided
    const detectedCollections = collections?.length > 0
      ? collections
      : await categorizeImage(base64Data);

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
