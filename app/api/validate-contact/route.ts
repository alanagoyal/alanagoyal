import { initLogger, invoke, wrapTraced } from "braintrust";
import { NextResponse } from 'next/server';

initLogger({
  projectName: "messages",
  apiKey: process.env.BRAINTRUST_API_KEY,
  asyncFlush: true,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const name = (body as Record<string, unknown>).name;
    if (typeof name !== "string") {
      return NextResponse.json(
        { error: "name must be a string" },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();
    if (normalizedName.length < 1 || normalizedName.length > 80) {
      return NextResponse.json(
        { error: "name must be between 1 and 80 characters" },
        { status: 400 }
      );
    }

    const data = await handleRequest(normalizedName);
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

const handleRequest = wrapTraced(async function handleRequest(name: string) {
  try {
    const result = await invoke({
      projectName: "messages",
      slug: "validate-name-317c",
      input: {
        name,
      },
      stream: false,
    });
    return result;
  } catch (error) {
    console.error("Error in handleRequest:", error);
    throw error;
  }
});
