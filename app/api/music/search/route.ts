import { NextResponse } from "next/server";

interface ITunesSearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl?: string;
  trackTimeMillis: number;
}

interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesSearchResult[];
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 25;

function parseLimit(rawLimit: string | null): number | null {
  if (!rawLimit) return DEFAULT_LIMIT;
  if (!/^\d+$/.test(rawLimit)) return null;
  const parsed = Number.parseInt(rawLimit, 10);
  if (parsed < 1 || parsed > MAX_LIMIT) return null;
  return parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const termRaw = searchParams.get("term");
  const term = termRaw?.trim();
  const limit = parseLimit(searchParams.get("limit"));

  if (!term || term.length > 200) {
    return NextResponse.json(
      { error: "Search term is required and must be 200 characters or less" },
      { status: 400 }
    );
  }

  if (limit === null) {
    return NextResponse.json(
      { error: `limit must be an integer between 1 and ${MAX_LIMIT}` },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=${limit}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }

    const data: ITunesSearchResponse = await response.json();

    const results = data.results.map((result) => ({
      trackId: result.trackId,
      trackName: result.trackName,
      artistName: result.artistName,
      collectionName: result.collectionName,
      artworkUrl100: result.artworkUrl100,
      previewUrl: result.previewUrl,
      trackTimeMillis: result.trackTimeMillis,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search tracks" },
      { status: 500 }
    );
  }
}
