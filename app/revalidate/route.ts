import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  
  if (!slug) {
    return NextResponse.json({ message: 'Missing slug parameter' }, { status: 400 });
  }

  try {
    revalidatePath(`/${slug}`);
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}