import { NextResponse } from "next/server";
import { getTopArtists, getTopTracks } from "@/lib/music/spotify";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "artists";
    const timeRange = (searchParams.get("time_range") || "medium_term") as
      | "short_term"
      | "medium_term"
      | "long_term";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (type === "tracks") {
      const topTracks = await getTopTracks(timeRange, limit);
      return NextResponse.json(topTracks);
    } else {
      const topArtists = await getTopArtists(timeRange, limit);
      return NextResponse.json(topArtists);
    }
  } catch (error) {
    console.error("Error fetching top items:", error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
