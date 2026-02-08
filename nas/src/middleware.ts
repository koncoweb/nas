// Middleware disabled to avoid edge runtime issues with argon2
// Authentication is handled at the page and API route level instead

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Pass through all requests - authentication handled at page/API level
  return NextResponse.next()
}

export const config = {
  matcher: []  // Disabled for now
}
