import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { isIdeaBelongToUser } from "@/lib/dal/ideas";
import loggerServer from "@/loggerServer";
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

    const { isValid } = await isIdeaBelongToUser({
      ideaId,
      userId: session.user.id,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    loggerServer.error("Error updating idea status:", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
