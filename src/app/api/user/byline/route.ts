import { authOptions } from "@/auth/authOptions";
import { getBylineByUserId } from "@/lib/dal/byline";
import { Byline } from "@/types/article";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const byline = await getBylineByUserId(session.user.id);
    const response: Byline = {
      authorId: Number(byline?.id),
      handle: byline?.handle || "",
      name: byline?.name || "",
      photoUrl: byline?.photoUrl || "",
      bio: byline?.bio || "",
    };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
