import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { Logger } from "@/logger";
import { prisma } from "@/lib/prisma";
import { FeedbackType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, subject, message, metadata } = body;

    if (!type || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const feedback = await prisma.userFeedback.create({
      data: {
        userId: session.user.id,
        type: type as FeedbackType,
        subject,
        message,
        metadata,
      },
    });

    Logger.info("Feedback submitted", {
      userId: session.user.id,
      feedbackId: feedback.id,
      type: feedback.type,
    });

    return NextResponse.json(feedback);
  } catch (error) {
    Logger.error("Failed to submit feedback", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedback = await prisma.userFeedback.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        responses: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          where: {
            isInternal: false,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    Logger.error("Failed to fetch feedback", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 },
    );
  }
}
