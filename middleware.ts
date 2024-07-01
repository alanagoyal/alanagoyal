import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for the root URL
  if (request.nextUrl.pathname === '/') {
    // Redirect to '/about-me'
    return NextResponse.redirect(new URL('/about-me', request.url));
  }

  // Allow the request to proceed as usual
  return NextResponse.next();
}

// Configure the middleware to match the root URL
export const config = {
  matcher: '/',
};
