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
    entry?: ITunesRSSEntry | ITunesRSSEntry[];
  };
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const CHART_TYPES = new Set(["albums", "songs"]);

function parseLimit(rawLimit: string | null): number | null {
  if (!rawLimit) return DEFAULT_LIMIT;
  if (!/^\d+$/.test(rawLimit)) return null;
  const parsed = Number.parseInt(rawLimit, 10);
  if (parsed < 1 || parsed > MAX_LIMIT) return null;
  return parsed;
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

function normalizeEntries(
  entry: ITunesRSSFeed["feed"]["entry"]
): ITunesRSSEntry[] {
  if (!entry) return [];
  return Array.isArray(entry) ? entry : [entry];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeRaw = searchParams.get("type");
  const type = typeRaw?.trim() || "albums";
  const limit = parseLimit(searchParams.get("limit"));

  if (!CHART_TYPES.has(type)) {
    return NextResponse.json(
      { error: "type must be either 'albums' or 'songs'" },
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
    const items = normalizeEntries(data.feed.entry).map(transformEntry);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Charts API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch charts" },
      { status: 500 }
    );
  }
}
