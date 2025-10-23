import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { slug, layout } = await request.json();
    const token = request.headers.get('x-revalidate-token');

    if (!token || token !== process.env.REVALIDATE_TOKEN) {
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
        type: 'layout',
        now: Date.now()
      });
    }

    // Revalidate specific note page
    if (!slug) {
      return NextResponse.json(
        { message: "Missing slug parameter" },
        { status: 400 }
      );
    }

    revalidatePath(`/notes/${slug}`);
    return NextResponse.json({
      revalidated: true,
      type: 'page',
      slug,
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
