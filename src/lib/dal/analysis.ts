import { parseJson } from "@/lib/utils/json";

import { prisma, prismaArticles } from "@/lib/prisma";
import { generateNotesDescriptionPrompt } from "@/lib/prompts";
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
    take: 150,
  });

  if (userNotes.length === 0) {
    return { error: "No notes found", status: 404 };
  }

  const messages = generateNotesDescriptionPrompt(userNotes);

  const generatedDescription = await runPrompt(
    messages,
    "deepseek/deepseek-r1",
  );

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

  return {
    noteWritingStyle: descriptionObject.noteWritingStyle,
    noteTopics: descriptionObject.noteTopics,
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
