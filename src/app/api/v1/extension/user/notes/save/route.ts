import loggerServer from "@/loggerServer";
import {
  ExtensionResponseNoteComment,
  parseToDb,
} from "@/types/note-extension-response";
import { NextRequest, NextResponse } from "next/server";
import { prismaArticles } from "@/lib/prisma";
import { NotesAttachments } from "../../../../../../../../prisma/generated/articles";
import { NotesComments } from "../../../../../../../../prisma/generated/articles";

export async function GET(request: NextRequest) {
  const body = await request.json();
  const apiKey = request.headers.get("X-API-Key");

  if (!apiKey || apiKey !== process.env.EXTENSION_API_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const notes: ExtensionResponseNoteComment[] = body;
    // const notes: ExtensionResponseNoteComment[] = data;

    const dbItems: { note: NotesComments; attachments: NotesAttachments[] }[] =
      parseToDb(notes);

    for (const item of dbItems) {
      if (!item.note.commentId || !item.note.authorId) {
        continue;
      }
      try {
        await prismaArticles.notesComments.upsert({
          where: {
            commentId_authorId: {
              commentId: item.note.commentId,
              authorId: item.note.authorId,
            },
          },
          update: item.note,
          create: item.note,
        });
      } catch (error: any) {
        debugger;
      }

      for (const attachment of item.attachments) {
        await prismaArticles.notesAttachments.upsert({
          where: {
            id: attachment.id,
          },
          update: attachment,
          create: attachment,
        });
      }
    }
    return NextResponse.json({ message: "Notes saved successfully" });
  } catch (error: any) {
    loggerServer.error("Error saving user notes", {
      error: error.message,
      stack: error.stack,
      userId: "extension",
    });
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
