import { authOptions } from "@/auth/authOptions";
import { validateCookies } from "@/lib/dal/substackCookies";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    const { valid, expiresAt } = await validateCookies(session.user.id);
    return NextResponse.json({ valid, expiresAt });
  } catch (error: any) {
    loggerServer.error("Error validating cookies", {
      error,
      userId: session.user.id,
    });
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
      },
    );
  }
}
