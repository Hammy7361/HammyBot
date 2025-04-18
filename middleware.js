import { NextResponse } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request) {
  // Simply pass through all requests without any modifications
  return NextResponse.next()
}

// Configure the middleware to run only on specific paths if needed
export const config = {
  matcher: [], // Empty array means it won't match any paths
}
