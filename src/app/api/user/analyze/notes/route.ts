import prisma, { prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
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

    const authorId = await getAuthorId(userId);
    if (!authorId) {
      return NextResponse.json(
        { error: "Author ID not found" },
        { status: 404 },
      );
    }

    const userNotes = await prismaArticles.notesComments.findMany({
      where: {
        authorId: authorId,
      },
      orderBy: {
        date: "desc",
      },
      take: 150,
    });

    if (userNotes.length === 0) {
      return NextResponse.json({ error: "No notes found" }, { status: 404 });
    }

    const messages = generateNotesDescriptionPrompt(userNotes);

    const [
      generatedDescription,
      //   generatedDescriptionClaude35,
      //   generatedDescriptionClaude37,
      //   generatedDescriptionGPT45,
    ] = await Promise.all([
      //   runPrompt(messages, "google/gemini-2.0-flash-001"),
      //   runPrompt(messages, "anthropic/claude-3.5-sonnet"),
      runPrompt(messages, "anthropic/claude-3.7-sonnet"),
      //   runPrompt(messages, "openai/gpt-4.5-preview"),
    ]);

    const descriptionObject: {
      noteWritingStyle: string;
      noteTopics: string;
    } = await parseJson(generatedDescription);

    await prisma.userMetadata.update({
      where: { userId: userId },
      data: {
        noteWritingStyle: descriptionObject.noteWritingStyle,
        noteTopics: descriptionObject.noteTopics,
      },
    });
    return NextResponse.json({
      success: true,
      descriptionObject,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
