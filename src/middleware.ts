import { NextRequest, NextResponse } from "next/server";

const getCode = (req: NextRequest): string => {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  return code || "";
};

export async function middleware(req: NextRequest) {
  const response = await registerMiddleware(req);
  return response;
}

async function registerMiddleware(req: NextRequest) {
  const codeFromUrl = getCode(req);
  const codeFromCookie = req.cookies.get("code")?.value;

  console.log("Hit middleware with code: ", codeFromUrl);
  console.log("Hit middleware with code from cookie: ", codeFromCookie);

  const code = codeFromUrl || codeFromCookie;

  const response = NextResponse.next();
  if (code) {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    response.cookies.set("code", code, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      expires: nextWeek,
    });
  }
  return response;
}

export const config = {
  matcher: ["/login", "/"],
};

export { default } from "next-auth/middleware";
