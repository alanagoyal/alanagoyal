import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";

const NOTE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

function isValidRevalidateToken(token: string | null): boolean {
  const configuredToken = process.env.REVALIDATE_TOKEN;

  if (!configuredToken || !token) {
    return false;
  }

  const providedTokenBuffer = Buffer.from(token);
  const configuredTokenBuffer = Buffer.from(configuredToken);

  if (providedTokenBuffer.length !== configuredTokenBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedTokenBuffer, configuredTokenBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const { slug, layout } = await request.json();
    const token = request.headers.get("x-revalidate-token");

    if (!process.env.REVALIDATE_TOKEN) {
      return NextResponse.json(
        { message: "REVALIDATE_TOKEN is not configured" },
        { status: 500 }
      );
    }

    if (!isValidRevalidateToken(token)) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    // Revalidate layout (sidebar) if requested
    if (layout) {
      revalidatePath('/notes', 'layout');
      return NextResponse.json({
        revalidated: true,
        type: "layout",
        now: Date.now()
      });
    }

    // Revalidate specific note page
    const normalizedSlug = typeof slug === "string" ? slug.trim() : "";

    if (!normalizedSlug) {
      return NextResponse.json(
        { message: "Missing slug parameter" },
        { status: 400 }
      );
    }

    if (!NOTE_SLUG_PATTERN.test(normalizedSlug)) {
      return NextResponse.json(
        { message: "Invalid slug format" },
        { status: 400 }
      );
    }

    revalidatePath(`/notes/${normalizedSlug}`);
    return NextResponse.json({
      revalidated: true,
      type: "page",
      slug: normalizedSlug,
      now: Date.now()
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Error revalidating" },
      { status: 500 }
    );
  }
}
