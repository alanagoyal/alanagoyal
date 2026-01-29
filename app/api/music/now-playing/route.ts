import { NextResponse } from "next/server";
import { getNowPlaying } from "@/lib/music/spotify";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const nowPlaying = await getNowPlaying();
    return NextResponse.json(nowPlaying);
  } catch (error) {
    console.error("Error fetching now playing:", error);
    return NextResponse.json(
      { isPlaying: false, track: null, progress_ms: 0, timestamp: Date.now() },
      { status: 200 }
    );
  }
}
