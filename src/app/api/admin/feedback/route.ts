import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { prisma, prismaArticles } from "@/lib/prisma";
import { FeedbackStatus } from "@prisma/client";
import loggerServer from "@/loggerServer";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.meta?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const feedback = await prisma.userFeedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get user handles from articles DB
    const userIds = feedback.map(f => f.userId);
    const userMetadataList = await prisma.userMetadata.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        userId: true,
        publication: {
          select: {
            authorId: true,
          },
        },
      },
    });

    // Get handles from articles DB
    const authorIds = userMetadataList
      .map(um => um.publication?.authorId)
      .filter(Boolean) as number[];

    const bylines = await prismaArticles.byline.findMany({
      where: {
        id: { in: authorIds },
      },
      select: {
        id: true,
        handle: true,
      },
    });

    // Create a mapping of userId to handle
    const userHandleMap = new Map<string, string>();
    userMetadataList.forEach(um => {
      if (um.publication?.authorId) {
        const byline = bylines.find(b => b.id === um.publication?.authorId);
        if (byline?.handle) {
          userHandleMap.set(um.userId, byline.handle);
        }
      }
    });

    const feedbackWithHandles = feedback.map(f => ({
      ...f,
      user: {
        ...f.user,
        handle: userHandleMap.get(f.userId) || null,
      },
    }));

    return NextResponse.json(feedbackWithHandles);
  } catch (error) {
    loggerServer.error("Error fetching feedback", { 
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.meta?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { feedbackId, status } = await request.json();

    if (!feedbackId || !status || !Object.values(FeedbackStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid feedbackId or status" },
        { status: 400 }
      );
    }

    const updatedFeedback = await prisma.userFeedback.update({
      where: { id: feedbackId },
      data: { status },
    });

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    loggerServer.error("Error updating feedback status", { 
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}