import { initLogger, invoke, wrapTraced } from "braintrust";
import { NextResponse } from 'next/server';

initLogger({
  projectName: "messages",
  apiKey: process.env.BRAINTRUST_API_KEY,
  asyncFlush: true,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;
    const data = await handleRequest(name);
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