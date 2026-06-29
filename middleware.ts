import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();

  // Add x-request-id to request headers so API handlers can access it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // Pass custom request headers to route handlers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Inject correlation ID into response headers for client tracing
  response.headers.set("x-request-id", requestId);

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
