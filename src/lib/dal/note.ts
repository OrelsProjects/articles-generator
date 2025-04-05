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
  "scheduledTo",
  "timestamp",
] as (keyof NoteDraft)[];

export async function isOwnerOfNote(noteId: string, userId: string) {
  console.log("About to check owner of note", noteId, userId);
  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
      userId: userId,
    },
    select: {
      id: true,
    },
  });

  console.log("note", note);

  return !!note;
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
    // Create a copy of newNote to modify
    const noteToUpdate: Record<string, any> = {};

    // Handle each updateable field
    for (const field of updateableFields) {
      if (newNote[field] !== undefined) {
        // For timestamp, use the scheduledTo field in the database
        if (field === "scheduledTo") {
          noteToUpdate.scheduledTo = newNote.scheduledTo;
        } else {
          noteToUpdate[field] = newNote[field];
        }
      }
    }

    await prisma.note.update({ where: { id }, data: noteToUpdate });
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

export const getNoteById = async (noteId: string): Promise<Note | null> => {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
  });
  return note;
};
