import prisma, { prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { setUserNotesDescription as setUserNotesDescription } from "@/lib/dal/analysis";
import { getAuthorId } from "@/lib/dal/publication";
import { runPrompt } from "@/lib/open-router";
import { generateNotesDescriptionPrompt } from "@/lib/prompts";
import { parseJson } from "@/lib/utils/json";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // const userId = "67d015d26230c417488f62ed";
  const userId = session.user.id;
  try {
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: userId,
      },
      include: {
        publication: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!userMetadata) {
      return NextResponse.json(
        { error: "User metadata not found" },
        { status: 404 },
      );
    }

    if (userMetadata.noteTopics && userMetadata.noteWritingStyle) {
      return NextResponse.json({
        success: true,
        descriptionObject: {
          noteTopics: userMetadata.noteTopics,
          noteWritingStyle: userMetadata.noteWritingStyle,
        },
      });
    }

    const descriptionResponse = await setUserNotesDescription(userId);

    if ("error" in descriptionResponse) {
      return NextResponse.json(
        { error: descriptionResponse.error },
        { status: descriptionResponse.status },
      );
    }

    return NextResponse.json({
      success: true,
      descriptionObject: descriptionResponse,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
