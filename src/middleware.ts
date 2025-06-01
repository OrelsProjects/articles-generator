import loggerServer from "@/loggerServer";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    const headers = Object.fromEntries(request.headers.entries());
    const body = await request.json();
    loggerServer.info("API Request Log:", {
      endpoint: request.nextUrl.pathname,
      method: request.method,
      headers: JSON.stringify(headers, null, 2),
      body: JSON.stringify(body, null, 2),
      userId: "middleware",
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
