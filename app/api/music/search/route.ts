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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term");
  const limit = searchParams.get("limit") || "5";

  if (!term) {
    return NextResponse.json(
      { error: "Search term is required" },
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
