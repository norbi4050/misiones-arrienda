import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Simple client-side auth check will be handled by the components themselves
  // This middleware just handles basic redirects
  
  // For now, just pass through all requests
  // The auth protection will be handled in the individual page components
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/(auth)/:path*']
}
