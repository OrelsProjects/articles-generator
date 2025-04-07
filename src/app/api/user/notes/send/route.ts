import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { sendMail } from "@/lib/mail/mail";
import { generateFailedToSendNoteEmail } from "@/lib/mail/templates";
import { markdownToADF } from "@/lib/utils/adf";
import { prepareAttachmentsForNote } from "@/lib/substack";
import loggerServer from "@/loggerServer";
import { CookieName } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  userId: z.string().optional(),
  noteId: z.string(),
});

const sendFailure = async (noteBody: string, noteId: string, email: string) => {
  try {
    await sendMail({
      to: email,
      from: "support",
      subject: "Failed to send note",
      template: generateFailedToSendNoteEmail(noteBody, noteId),
      cc: [],
    });
  } catch (error) {
    loggerServer.error("Error to send note: " + error);
  }
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  console.log(body);
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  let { userId, noteId } = parse.data;

  try {
    if (!session) {
      const secret = request.headers.get("x-substack-schedule-secret");
      if (secret !== process.env.SUBSTACK_SCHEDULE_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      userId = session.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cookie = await prisma.substackCookie.findUnique({
      where: {
        name_userId: {
          name: CookieName.substackSid,
          userId,
        },
      },
    });

    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
      },
      include: {
        S3Attachment: true,
      },
    });

    if (!note) {
      console.error("Note not found");
      await sendFailure("Note not found", noteId, user.email);
      loggerServer.error("Note not found: " + noteId + " for user: " + userId);
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // If session is not null, it means that the note is being sent from the web app
    // and we don't want to prevent it
    if (note.status === "published" && !session) {
      return NextResponse.json(
        { error: "Note already published" },
        { status: 400 },
      );
    }

    if (!cookie) {
      console.error("Cookie not found");
      await sendFailure(note.body, noteId, user.email);
      loggerServer.error(
        "Cookie not found: " + noteId + " for user: " + userId,
      );
      return NextResponse.json({ error: "Cookie not found" }, { status: 404 });
    }

    const adf = await markdownToADF(note.body);
    let messageData: {
      bodyJson: any;
      attachmentIds?: string[];
    } = {
      bodyJson: adf,
    };

    if (note.S3Attachment.length > 0) {
      const attachments = await prepareAttachmentsForNote(noteId);
      messageData.attachmentIds = attachments.map(attachment => attachment.id);
    }

    const response = await fetch("https://substack.com/api/v1/comment/feed", {
      headers: {
        "Content-Type": "application/json",
        Referer: "https://substack.com/home",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        Cookie: `substack.sid=${cookie.value}`,
      },
      body: JSON.stringify(messageData),
      method: "POST",
    });

    if (!response.ok) {
      const errorMessage = await response.json();
      await sendFailure(note.body, note.id, user.email);
      loggerServer.error(
        "Error to send note: " +
          response.statusText +
          "response: " +
          errorMessage +
          " for note: " +
          noteId +
          " for user: " +
          userId,
      );
      return NextResponse.json(
        { error: "Failed to send note: " + errorMessage },
        { status: 500 },
      );
    }

    const data = await response.json();

    await prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        sentViaScheduleAt: new Date(),
        status: "published",
      },
    });

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    loggerServer.error(
      "Error to send note: " +
        error +
        " for note: " +
        noteId +
        " for user: " +
        userId,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
