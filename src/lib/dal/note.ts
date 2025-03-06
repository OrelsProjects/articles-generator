import prisma from "@/app/api/_db/db";
import { NoteDraft } from "@/types/note";
import { Note } from "@prisma/client";

export type CreateNote = Omit<Note, "id" | "createdAt" | "updatedAt">;

export const updateableFields = [
  "status",
  "feedback",
  "feedbackComment",
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

export const updateNote = async (note: NoteDraft) => {
  const fieldsToUpdate = updateableFields.filter(field => note[field]);
  const data: any = {};
  fieldsToUpdate.forEach(field => {
    if (note[field] !== "undefined") {
      data[field] = note[field];
    } else {
      data[field] = undefined;
    }
  });
  await prisma.note.update({ where: { id: note.id }, data });
};

export const createNote = async (note: CreateNote): Promise<Note> => {
  return await prisma.note.create({
    data: {
      ...note,
    },
  });
};


export const archiveNote = async (noteId: string) => {
  await prisma.note.update({ where: { id: noteId }, data: { status: "archived" } });
};
