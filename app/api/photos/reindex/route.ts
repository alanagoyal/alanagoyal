import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { analyzeAndEmbedPhoto, isPhotoAIConfigured } from "@/lib/photos/ai";

export const maxDuration = 60;

interface PhotoToIndex {
  id: string;
  filename: string;
  url: string;
  timestamp: string;
  collections: string[] | null;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  const expectedKey = process.env.PHOTOS_UPLOAD_API_KEY;
  const suppliedKey = request.headers.get("x-api-key");
  if (!expectedKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  if (!suppliedKey || suppliedKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPhotoAIConfigured()) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: unknown };
  const requestedLimit = typeof body.limit === "number" ? Math.floor(body.limit) : 5;
  const limit = Math.min(10, Math.max(1, requestedLimit));
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("photos")
    .select("id, filename, url, timestamp, collections")
    .is("embedding", null)
    .order("timestamp", { ascending: true })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const indexed: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  for (const photo of (data ?? []) as PhotoToIndex[]) {
    try {
      const result = await analyzeAndEmbedPhoto(photo.url, {
        filename: photo.filename,
        collections: photo.collections ?? [],
        timestamp: photo.timestamp,
      });
      if (!result?.embedding) throw new Error("Image analysis or embedding failed");
      const { error: updateError } = await supabase
        .from("photos")
        .update({
          caption: result.analysis.caption,
          tags: result.analysis.tags,
          ocr_text: result.analysis.ocrText,
          collections: result.analysis.collections,
          embedding: result.embedding,
          analyzed_at: new Date().toISOString(),
        })
        .eq("id", photo.id);
      if (updateError) throw updateError;
      indexed.push(photo.id);
    } catch (indexError) {
      failed.push({
        id: photo.id,
        error: indexError instanceof Error ? indexError.message : "Unknown indexing error",
      });
    }
  }

  const { count: remaining } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .is("embedding", null);

  return NextResponse.json({ indexed, failed, remaining: remaining ?? null });
}
