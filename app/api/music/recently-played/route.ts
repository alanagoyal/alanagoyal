import { NextResponse } from "next/server";
import { getRecentlyPlayed } from "@/lib/music/spotify";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const recentlyPlayed = await getRecentlyPlayed(limit);
    return NextResponse.json(recentlyPlayed);
  } catch (error) {
    console.error("Error fetching recently played:", error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
