import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await prisma.visits.create({
      data: {
        userId: session.user.id,
        name: session.user.name || "",
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    loggerServer.error(error);
    return NextResponse.json(
      { error: "Internal server error" + error.message },
      { status: 500 },
    );
  }
}
