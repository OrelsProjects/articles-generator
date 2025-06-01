import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    if (request.nextUrl.pathname.startsWith("/api")) {
      let body: string | null = null;
      let headers: Record<string, string> | null = null;
      try {
        body = await request.json();
      } catch (error) {
        body = null;
      }

      try {
        headers = Object.fromEntries(request.headers.entries());
      } catch (error) {
        headers = null;
      }

      console.log("API Request Log:", {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        headers: JSON.stringify(headers, null, 2),
        body: JSON.stringify(body, null, 2),
        userId: "middleware",
      });
    }
  } catch (error) {
    console.error("Error logging API request:", error);
  } finally {
    return NextResponse.next();
  }
}

export const config = {
  matcher: "/api/:path*",
};
