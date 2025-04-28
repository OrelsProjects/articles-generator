import { parseJson } from "@/lib/utils/json";

import {prisma, prismaArticles } from "@/app/api/_db/db";
import { generateNotesDescriptionPrompt } from "@/lib/prompts";
import { runPrompt } from "@/lib/open-router";
import { getAuthorId } from "@/lib/dal/publication";
import { UserMetadata } from "@prisma/client";

export async function setUserNotesDescription(userId: string): Promise<
  | {
      noteWritingStyle: string;
      noteTopics: string;
    }
  | { status: number; error: string }
> {
  const authorId = await getAuthorId(userId);
  if (!authorId) {
    return { error: "Author ID not found", status: 404 };
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
export const shouldRefreshUserMetadata = (userMetadata: UserMetadata) => {
  const now = new Date();
  const lastUpdatedAt = userMetadata.dataUpdatedAt;
  if (!lastUpdatedAt) {
    return true;
  }
  const diffTime = Math.abs(now.getTime() - lastUpdatedAt.getTime());
  const diffHours = diffTime / (1000 * 60 * 60);
  return diffHours > 24;
};
