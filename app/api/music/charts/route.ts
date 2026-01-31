import { NextResponse } from "next/server";

interface ITunesRSSEntry {
  "im:name": { label: string };
  "im:artist": { label: string; attributes?: { href: string } };
  "im:image": Array<{ label: string; attributes: { height: string } }>;
  id: { label: string; attributes: { "im:id": string } };
  "im:releaseDate": { label: string; attributes: { label: string } };
  category: { attributes: { label: string } };
  link: { attributes: { href: string } };
}

interface ITunesRSSFeed {
  feed: {
    entry: ITunesRSSEntry[];
  };
}

function transformEntry(entry: ITunesRSSEntry) {
  // Get the largest image and upscale to 600x600
  const imageUrl = entry["im:image"][2]?.label || entry["im:image"][0]?.label;
  const albumArt = imageUrl?.replace(/\d+x\d+bb/, "600x600bb") || "";

  return {
    id: entry.id.attributes["im:id"],
    name: entry["im:name"].label,
    artist: entry["im:artist"].label,
    artistUrl: entry["im:artist"].attributes?.href || "",
    albumArt,
    url: entry.link?.attributes?.href || entry.id.label,
    releaseDate: entry["im:releaseDate"]?.attributes?.label || "",
    genre: entry.category?.attributes?.label || "",
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "albums";
  const limit = searchParams.get("limit") || "25";

  try {
    const endpoint =
      type === "songs"
        ? `https://itunes.apple.com/us/rss/topsongs/limit=${limit}/json`
        : `https://itunes.apple.com/us/rss/topalbums/limit=${limit}/json`;

    const response = await fetch(endpoint, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }

    const data: ITunesRSSFeed = await response.json();
    const items = data.feed.entry?.map(transformEntry) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Charts API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch charts" },
      { status: 500 }
    );
  }
}
