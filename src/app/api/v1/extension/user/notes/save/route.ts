import loggerServer from "@/loggerServer";
import {
  ExtensionResponseNoteComment,
  parseToDb,
} from "@/types/note-extension-response";
import { NextRequest, NextResponse } from "next/server";
import { prismaArticles } from "@/lib/prisma";
import { NotesAttachments } from "../../../../../../../../prisma/generated/articles";
import { NotesComments } from "../../../../../../../../prisma/generated/articles";

export async function POST(request: NextRequest) {
  loggerServer.info("[SAVING-NOTES] User requested to save notes", {
    userId: "extension",
  });
  const body = await request.json();
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey || apiKey !== process.env.EXTENSION_API_KEY) {
    loggerServer.error("[SAVING-NOTES] Unauthorized", {
      apiKey,
      userId: "extension",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    loggerServer.info("[SAVING-NOTES] Parsing notes", {
      userId: "extension",
    });
    const notes: ExtensionResponseNoteComment[] = body;

    const dbItems: { note: NotesComments; attachments: NotesAttachments[] }[] =
      parseToDb(notes);

    loggerServer.info("[SAVING-NOTES] Parsed notes", {
      notesCount: dbItems.length,
      userId: "extension",
    });

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
        loggerServer.error("Error saving user notes", {
          error: error.message,
          stack: error.stack,
          userId: "extension",
        });
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
    loggerServer.info("[SAVING-NOTES] Notes saved successfully", {
      userId: "extension",
    });
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
