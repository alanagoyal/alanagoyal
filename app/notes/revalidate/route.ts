import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();
    const token = request.headers.get('x-revalidate-token');

    if (!token || token !== process.env.REVALIDATE_TOKEN) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { message: "Missing slug parameter" },
        { status: 400 }
      );
    }

    revalidatePath(`/notes/${slug}`);
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Error revalidating" },
      { status: 500 }
    );
  }
}
