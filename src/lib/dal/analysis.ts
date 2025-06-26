import { parseJson } from "@/lib/utils/json";

import { prisma, prismaArticles } from "@/lib/prisma";
import { generateNotesDescriptionPrompt, generateVectorSearchOptimizedDescriptionPrompt } from "@/lib/prompts";
import { runPrompt } from "@/lib/open-router";
import { getAuthorId } from "@/lib/dal/publication";
import { UserMetadata } from "@prisma/client";
import loggerServer from "@/loggerServer";

export async function setUserNotesDescription(
  userId: string,
  authorId: number | null,
): Promise<
  | {
      noteWritingStyle: string;
      noteTopics: string;
      notesDescription: string;
    }
  | { status: number; error: string }
> {
  let validAuthorId: number | null = authorId;
  if (!validAuthorId) {
    validAuthorId = await getAuthorId(userId);
  }
  if (!validAuthorId) {
    return { error: "Author ID not found", status: 404 };
  }

  const userNotes = await prismaArticles.notesComments.findMany({
    where: {
      authorId: validAuthorId,
    },
    orderBy: {
      date: "desc",
    },
    take: 300,
  });

  if (userNotes.length === 0) {
    return { error: "No notes found", status: 404 };
  }

  const messages = generateNotesDescriptionPrompt(userNotes);

  const generatedDescription = await runPrompt(
    messages,
    "deepseek/deepseek-r1",
    "G-N-DESC-F" + userId,
  );

  const descriptionObject: {
    noteWritingStyle: string;
    noteTopics: string;
    notesDescription: string;
  } = await parseJson(generatedDescription);

  await prisma.userMetadata.update({
    where: { userId: userId },
    data: {
      noteWritingStyle: descriptionObject.noteWritingStyle,
      noteTopics: descriptionObject.noteTopics,
      notesDescription: descriptionObject.notesDescription,
    },
  });

  return {
    noteWritingStyle: descriptionObject.noteWritingStyle,
    noteTopics: descriptionObject.noteTopics,
    notesDescription: descriptionObject.notesDescription,
  };
}

// 24 hours passed?
export const shouldRefreshUserPublicationData = (userMetadata: UserMetadata) => {
  const now = new Date();
  const lastUpdatedAt = userMetadata.dataUpdatedAt;
  loggerServer.info("shouldRefreshUserMetadata", {
    lastUpdatedAt,
    now,
    userId: userMetadata.userId,
  });
  if (!lastUpdatedAt) {
    return true;
  }
  const diffTime = Math.abs(now.getTime() - lastUpdatedAt.getTime());
  const diffHours = diffTime / (1000 * 60 * 60);
  // 4 hours passed?
  return diffHours > 4;
};

export const getUserNotesDescription = async (
  userMetadata: {
    userId: string;
    notesDescription: string | null;
  },
  authorId: number,
  publicationId: string,
  options: {
    setIfNonExistent: boolean;
  } = {
    setIfNonExistent: true,
  }
) => {
  let validUserMetadata = { ...userMetadata };
  if (!userMetadata.notesDescription && options.setIfNonExistent) {
    await setUserNotesDescription(userMetadata.userId, authorId);
  }
  const newUserMetadata = await prisma.userMetadata.findUnique({
    where: { userId: userMetadata.userId },
    select: {
      userId: true,
      notesDescription: true,
    },
  });

  if (!newUserMetadata) {
    return null;
  }

  validUserMetadata = {
    userId: newUserMetadata?.userId,
    notesDescription: newUserMetadata?.notesDescription,
  };
  const prompt =
    generateVectorSearchOptimizedDescriptionPrompt(validUserMetadata);
  const [deepseek] = await Promise.all([
    runPrompt(
      prompt,
      "deepseek/deepseek-r1",
      "G-N-DESC-" + userMetadata.userId,
    ),
    // runPrompt(prompt, "openai/gpt-4.1"),
    // runPrompt(prompt, "openai/gpt-4.5-preview"),
    // runPrompt(prompt, "x-ai/grok-3-beta"),
    // runPrompt(prompt, "anthropic/claude-3.7-sonnet"),
    // runPrompt(prompt, "google/gemini-2.5-pro-preview-03-25"),
  ]);

  const result = await parseJson<{
    optimizedDescription: string;
  }>(deepseek);

  await prisma.publicationMetadata.update({
    where: { id: publicationId },
    data: {
      generatedDescriptionForSearch: result.optimizedDescription,
    },
  });

  return result.optimizedDescription;
};