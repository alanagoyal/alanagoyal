import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { v4 as uuidv4 } from 'uuid'

export async function middleware(request: NextRequest) {
  // First, handle Supabase session
  let response = await updateSession(request)

  // Then, ensure session_id cookie exists
  const sessionId = request.cookies.get('session_id')?.value

  if (!sessionId) {
    // Generate a new session ID if one doesn't exist
    const newSessionId = uuidv4()
    response.cookies.set('session_id', newSessionId, {
      httpOnly: false, // Allow client-side access for localStorage sync
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      path: '/',
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
