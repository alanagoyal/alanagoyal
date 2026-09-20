import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { analyzePhoto, isPhotoAIConfigured } from "@/lib/photos/ai";

export const maxDuration = 60;

interface PhotoToIndex {
  id: string;
  url: string;
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
    .select("id, url, collections")
    .is("search_text", null)
    .order("timestamp", { ascending: true })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const indexed: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  await Promise.all(
    ((data ?? []) as PhotoToIndex[]).map(async (photo) => {
      try {
        const analysis = await analyzePhoto(photo.url);
        if (!analysis) throw new Error("Image analysis failed");
        const collections = (photo.collections ?? []).length > 0
          ? photo.collections
          : analysis.collections;
        const { error: updateError } = await supabase
          .from("photos")
          .update({
            search_text: analysis.searchText,
            collections,
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
    }),
  );

  const { count: remaining } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .is("search_text", null);

  return NextResponse.json({ indexed, failed, remaining: remaining ?? null });
}
