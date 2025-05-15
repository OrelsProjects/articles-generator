import {prisma, prismaArticles } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { getUserNotes } from "@/lib/dal/note";
import { runPrompt } from "@/lib/open-router";
import { generateImprovementPromptNote } from "@/lib/prompts";
import { canUseAI, undoUseCredits, useCredits } from "@/lib/utils/credits";
import { handleUsageError } from "@/lib/utils/ideas";
import loggerServer from "@/loggerServer";
import { AIUsageResponse } from "@/types/aiUsageResponse";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { NotesComments } from "../../../../../prisma/generated/articles";

const MAX_CHARACTERS = 1500;
export const maxDuration = 120; // This function can run for a maximum of 2 minutes

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AIUsageResponse<string>>> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let usageId: string = "";
  let didConsumeCredits = false;
  try {
    const { text, type, noteId, model: requestModel } = await request.json();

    const { result, status } = await canUseAI(
      session.user.id,
      "textEnhancement",
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Not enough credits" },
        { status },
      );
    }

    const { creditsUsed, creditsRemaining } = await useCredits(
      session.user.id,
      "textEnhancement",
    );

    didConsumeCredits = true;

    const userPublication = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        publication: true,
      },
    });

    const note = noteId
      ? await prisma.note.findUnique({
          where: {
            id: noteId,
          },
        })
      : null;

    const publication = userPublication?.publication;

    if (!publication) {
      return NextResponse.json(
        { success: false, error: "User publication not found" },
        { status: 400 },
      );
    }

    const slicedText = text.slice(0, MAX_CHARACTERS);

    let userNotes: NotesComments[] = [];

    if (type === "fit-user-style") {
      userNotes = await getUserNotes(session.user.id);
    }

    const userNotesBody = userNotes.map(note => note.body);

    const { messages, model: defaultModel } = generateImprovementPromptNote(
      slicedText,
      publication,
      type,
      {
        note,
        maxLength: Math.max(280, userNotesBody.length),
        userNotes: userNotesBody,
      },
    );

    // Map frontend model names to API model names
    let model = defaultModel;
    if (requestModel) {
      if (requestModel === "gpt-4.5") {
        model = "openai/gpt-4.5-preview";
      } else if (requestModel === "claude-3.5") {
        model = "anthropic/claude-3.5-sonnet";
      } else if (requestModel === "claude-3.7") {
        model = "anthropic/claude-3.7-sonnet";
      }
    }

    const response = await runPrompt(
      messages,
      model,
      "N-IMP-" + session.user.name,
    );

    return NextResponse.json({
      responseBody: {
        body: response || "",
        creditsUsed,
        creditsRemaining,
        type: "textEnhancement",
      },
    });
  } catch (error: any) {
    if (didConsumeCredits) {
      await undoUseCredits(session.user.id, "textEnhancement");
    }
    loggerServer.error("Error improving article:", {
      error,
      userId: session?.user.id,
    });

    const { message, status } = await handleUsageError(error, usageId);

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
