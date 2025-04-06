import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    let canSchedule = false;
    const userCookies = await prisma.substackCookie.findMany({
      where: {
        userId: session.user.id,
      },
    });

    canSchedule = userCookies.some(cookie => cookie.name == "substackSid");

    return NextResponse.json({ canSchedule });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
