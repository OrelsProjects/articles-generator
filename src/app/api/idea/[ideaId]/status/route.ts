import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { IdeaStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  params: {
    params: { ideaId: string };
  },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const status = req.nextUrl.searchParams.get("status") as IdeaStatus;
    const isFavorite = req.nextUrl.searchParams.get("isFavorite") === "true";
    const ideaId = params.params.ideaId;

    if ((!status && !isFavorite) || !ideaId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const updateData = isFavorite
      ? { isFavorite }
      : { status: status as IdeaStatus };

    await prisma.idea.update({
      where: {
        id: ideaId,
      },
      data: updateData,
    });
    return NextResponse.json(
      { message: "Idea status updated" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
