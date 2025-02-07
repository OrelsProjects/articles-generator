import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const user = session.user;
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: user.id,
      },
    });
    return NextResponse.json({ plan: userMetadata?.plan }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
