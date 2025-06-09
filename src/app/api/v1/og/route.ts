import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getOg } from "@/lib/dal/og";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { url } = await request.json();
    const response = await getOg(url);
    if (!response) {
      loggerServer.error("OG data not found", {
        userId: session.user.id,
        url,
      });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(response);
  } catch (error) {
    loggerServer.error("Error getting OG data", {
      error: String(error),
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
