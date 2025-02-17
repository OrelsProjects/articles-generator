import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { isIdeaBelongToUser } from "@/lib/dal/ideas";
import { Idea } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const HISTORY_INTERVAL = 45;

// Save history once per 45 seconds
const shouldSaveHistory = (idea: Idea) => {
  const lastUpdate = new Date(idea.updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
  const diffSeconds = Math.round(diffTime / 1000);
  return diffSeconds > HISTORY_INTERVAL;
};

export async function PATCH(
  request: NextRequest,
  params: {
    params: {
      ideaId: string;
    };
  },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const { ideaId } = params.params;
    const { body, title, subtitle } = await request.json();
    const { isValid, idea } = await isIdeaBelongToUser({
      ideaId,
      userId: session.user.id,
    });

    if (!isValid || !idea) {
      return new Response("Unauthorized", { status: 401 });
    }

    let data: Partial<Idea> = { title, subtitle, body };

    if (shouldSaveHistory(idea)) {
      const history: Pick<Idea, "bodyHistory"> = {
        bodyHistory: [...idea.bodyHistory, idea.body],
      };
      data.bodyHistory = history.bodyHistory;
    }

    await prisma.idea.update({
      where: { id: ideaId },
      data,
    });

    return NextResponse.json(idea);
  } catch (error: any) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
