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
import { SubstackPostNoteResponse } from "@/types/note";

const schema = z.object({
  userId: z.string().optional(),
  noteId: z.string(),
});

const doesBodyContainLink = (body: string) => {
  const regexHttps = /https?:\/\/[^\s]+/g;
  const regexWww = /www\.[^\s]+/g;
  const regexDotCom = /\.com/g;
  return regexHttps.test(body) || regexWww.test(body) || regexDotCom.test(body);
};

const sendFailure = async (noteBody: string, noteId: string, email: string) => {
  try {
    const emailTemplate = generateFailedToSendNoteEmail(noteBody, noteId);
    await sendMail({
      to: email,
      from: "support",
      subject: emailTemplate.subject,
      template: emailTemplate.body,
      cc: ["orelsmail@gmail.com"],
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

    const cookies = await prisma.substackCookie.findMany({
      where: {
        userId,
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

    if (!cookies) {
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

    let retries = 3;
    let didSucceed = false;
    let response: any;
    const cookieCfBm = cookies.find(cookie => cookie.name === CookieName.cfBm);
    const cookieLli = cookies.find(
      cookie => cookie.name === CookieName.substackLl,
    );
    const cookieSubstackSid = cookies.find(
      cookie => cookie.name === CookieName.substackSid,
    );
    const cookieCfClearance = cookies.find(
      cookie => cookie.name === CookieName.cfClearance,
    );
    if (!cookieCfBm || !cookieLli || !cookieSubstackSid) {
      // await sendFailure(note.body, noteId, user.email);
      loggerServer.error(
        "Cookie not found: " + noteId + " for user: " + userId,
      );
      return NextResponse.json({ error: "Cookie not found" }, { status: 404 });
    }
    while (!didSucceed) {
      console.log("Sending note: " + noteId + " with retries: " + retries);
      console.log("Cookie: " + cookies);
      console.log("Message data: " + JSON.stringify(messageData));
      response = await fetch("https://substack.com/api/v1/comment/feed", {
        headers: {
          "Content-Type": "application/json",
          Referer: "https://substack.com/home",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          Cookie: [
            `substack.sid=${cookieSubstackSid.value}`,
            `_cf_bm=${cookieCfBm.value}`,
            `substack.lli=${cookieLli.value}`,
            `cf_clearance=mdrvkaQKqnWJ36ExXH29D1SErweDuidIOiWY6bDB20w-1745090797-1.2.1.1-_mWT1RD6hbG48mfGOKZlW6E7rpIluhcsSCN5joxPzoGchlSjTTeSuZS1WoMx0aiVPGjegiWcj8kGsRtuH0m1mS_mM95FtEJdWF3KMmbz0dlVbXIy8IgdQrASfy85ttpOhDFUxlbudi9uCjWc0OzUvpvHbqQU7BuAYWGH3p9tVWu.WNF026vc_ipSh9tlgfLp1FiRGL1NB19w86ksdOB8euuqDCw03fwt0JHtZVlSy1ecZGYnbkvo8tHmHvU0_T3SFZTvbKvMXd2bYs87XaaxcYqLgwMKGpxp5kX7GIg4TVF3oAuishohsZ_dIth5cRjM58kYLIItknmFH8ZyGJu.v.vNoQh1vKwhXkgVKXuS3wE`,
          ].join("; "),
        },
        credentials: "include", // <<< THIS IS LIFE
        body: JSON.stringify(messageData),
        method: "POST",
      });
      console.log("Ran fetch to send note: " + retries + " retries left");
      didSucceed = response.ok;
      if (!didSucceed) {
        const text = await response.text();
        console.log("Response: " + text);
        // const errorMessage = await response.json();
        // console.log("Error to send note: " + JSON.stringify(errorMessage));
      }
      retries--;
    }

    if (!didSucceed) {
      const errorMessage = await response.json();
      await sendFailure(note.body, note.id, user.email);
      loggerServer.error(
        "Error to send note: " +
          response.statusText +
          "response: " +
          JSON.stringify(errorMessage) +
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

    const data = (await response.json()) as SubstackPostNoteResponse;
    // if contains link, update the note so it removes the OG
    if (
      data.attachments.length > 0 &&
      note.S3Attachment.length === 0 &&
      doesBodyContainLink(note.body)
    ) {
      // path https://substack.com/api/v1/feed/comment/commentId
      const response = await fetch(
        `https://substack.com/api/v1/feed/comment/${data.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Referer: "https://substack.com/home",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            Cookie: `substack.sid=${cookieSubstackSid.value}`,
          },
          body: JSON.stringify(messageData),
        },
      );

      if (!response.ok) {
        loggerServer.error(
          "Error to remove OG: " +
            response.statusText +
            " for note: " +
            noteId +
            " for user: " +
            userId,
        );
      }
    }

    await prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        sentViaScheduleAt: note.scheduledTo ? new Date() : undefined,
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
