import { prisma } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { isIdeaBelongToUser } from "@/lib/dal/ideas";
import loggerServer from "@/loggerServer";
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

    return NextResponse.json({}, { status: 200 });
  } catch (error: any) {
    loggerServer.error("Error updating idea:", error.message);
    return NextResponse.json({ error: "Error updating idea" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userMetadata = await prisma.userMetadata.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!userMetadata) {
    return NextResponse.json(
      { error: "User was not initialized" },
      { status: 403 },
    );
  }

  const publicationId = userMetadata.publicationId;

  if (!publicationId) {
    return NextResponse.json(
      { error: "Publication was not initialized" },
      { status: 403 },
    );
  }

  try {
    const idea = await prisma.idea.create({
      data: {
        userId: session.user.id,
        publicationId,
        topic: "",
        title: "",
        subtitle: "",
        description: "",
        outline: "",
        inspiration: "",
        body: "",
        status: "new",
        modelUsedForIdeas: "",
        modelUsedForOutline: "",
      },
    });

    return NextResponse.json(idea);
  } catch (error: any) {
    loggerServer.error("Error creating idea:", error.message);
    return NextResponse.json({ error: "Error creating idea" }, { status: 500 });
  }
}
