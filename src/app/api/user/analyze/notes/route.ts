import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import {
  setUserNotesDescription as setUserNotesDescription,
  shouldRefreshUserPublicationData,
} from "@/lib/dal/analysis";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthorId } from "@/lib/dal/publication";

const bodySchema = z.object({
  authorId: z.string().or(z.number()).optional(),
  userTriggered: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  try {
    const body = await req.json();
    const parsedBody = bodySchema.safeParse(body);

    if (!parsedBody.success) {
      loggerServer.error("Invalid request", {
        error: parsedBody.error,
        userId: userId,
      });
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    let { authorId, userTriggered } = parsedBody.data;
    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!userMetadata) {
      return NextResponse.json(
        { error: "User metadata not found" },
        { status: 404 },
      );
    }

    if (
      !userTriggered &&
      userMetadata.noteTopics &&
      userMetadata.noteWritingStyle
    ) {
      return NextResponse.json({
        success: true,
        descriptionObject: {
          noteTopics: userMetadata.noteTopics,
          noteWritingStyle: userMetadata.noteWritingStyle,
        },
      });
    }

    if (userTriggered) {
      const shouldRefresh = shouldRefreshUserPublicationData(userMetadata);
      if (!shouldRefresh) {
        return NextResponse.json({
          success: true,
          descriptionObject: {
            noteTopics: userMetadata.noteTopics,
            noteWritingStyle: userMetadata.noteWritingStyle,
          },
        });
      }
    }

    const fetchedAuthorId = await getAuthorId(userId, {
      updateIfNotFound: true,
    });
    authorId = authorId || fetchedAuthorId || undefined;

    const validAuthorId = isNaN(parseInt(authorId?.toString() || ""))
      ? null
      : parseInt(authorId?.toString() || "");

    const descriptionResponse = await setUserNotesDescription(
      userId,
      validAuthorId,
    );

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
  } catch (error: any) {
    loggerServer.error("Error analyzing notes", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}
