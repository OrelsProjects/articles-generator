import { NextRequest } from "next/server";

import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/app/api/_db/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
     
    // LastWeeks notes
    const userNotes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: lastWeek,
        },
      },
    });

    return NextResponse.json(userNotes);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}
