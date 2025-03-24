import prisma, { prismaArticles } from "@/app/api/_db/db";
import { NoteDraft } from "@/types/note";
import { Note } from "@prisma/client";

export type CreateNote = Omit<Note, "id" | "createdAt" | "updatedAt">;

export const updateableFields = [
  "status",
  "feedback",
  "feedbackComment",
  "body",
  "isArchived",
] as (keyof NoteDraft)[];

export async function isOwnerOfNote(noteId: string, userId: string) {
  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
    select: {
      userId: true,
    },
  });

  return note?.userId === userId;
}

export const getUserNotes = async (
  userId: string,
  options: { limit: number } = { limit: 20 },
) => {
  const { limit } = options;
  const userMetadata = await prisma.userMetadata.findUnique({
    where: {
      userId,
    },
    select: {
      publication: {
        select: {
          authorId: true,
        },
      },
    },
  });

  if (!userMetadata) {
    return [];
  }

  const notes = await prismaArticles.notesComments.findMany({
    where: {
      authorId: userMetadata.publication?.authorId || 0,
    },
    orderBy: {
      date: "desc",
    },
    take: limit,
  });

  return notes;
};

export const updateNote = async (id: string, newNote: Partial<NoteDraft>) => {
  try {
    const fieldsToUpdate = updateableFields.filter(field => newNote[field]);
    const data: any = {};
    fieldsToUpdate.forEach(field => {
      data[field] = newNote[field];
    });

    await prisma.note.update({ where: { id }, data });
  } finally {
    await prisma.$disconnect();
  }
};

export const createNote = async (note: CreateNote): Promise<Note> => {
  return await prisma.note.create({
    data: {
      ...note,
    },
  });
};

export const archiveNote = async (noteId: string) => {
  await prisma.note.update({
    where: { id: noteId },
    data: { isArchived: true },
  });
};
