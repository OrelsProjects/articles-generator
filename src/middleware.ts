import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function shouldPassLog(req: NextRequest): Promise<boolean> {
  if (!req.nextUrl.pathname.startsWith("/api/v1/extension/log")) return true;

  try {
    // clone so the downstream route still gets the body
    const clone = req.clone();

    let payload: any;
    try {
      payload = await clone.json();
    } catch {
      return false; // bad JSON – drop
    }

    // bail if it’s an extension log that’s just MetaMask noise
    if (
      payload?.source === "extension" &&
      typeof payload?.message === "string" &&
      payload.message.toLowerCase().includes("metamask-provider")
    ) {
      return false;
    }

    return true; // everything else OK
  } catch (error) {
    console.error("Error checking if should pass log:", error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  try {
    if (request.headers.get("x-middleware-subrequest")) {
      return new Response(null, { status: 403 });
    }

    if (request.nextUrl.pathname.startsWith("/api")) {
      if (!(await shouldPassLog(request))) {
        // Didn't pass, fail the request
        return new Response(null, { status: 403 });
      }

      let body: string | null = null;
      let headers: Record<string, string> | null = null;
      try {
        const cloneRequest = request.clone();
        body = await cloneRequest.json();
      } catch (error) {
        body = null;
      }

      try {
        headers = Object.fromEntries(request.headers.entries());
      } catch (error) {
        headers = null;
      }

      // console.log("API Request Log:", {
      //   endpoint: request.nextUrl.pathname,
      //   method: request.method,
      //   headers: JSON.stringify(headers, null, 2),
      //   body: JSON.stringify(body, null, 2),
      //   userId: "middleware",
      // });
    }
    return NextResponse.next();
  } catch (error) {
    console.error("Error logging API request:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: "/api/:path*",
};
