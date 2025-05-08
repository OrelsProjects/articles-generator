import { prisma } from "@/lib/prisma";
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
import { HttpsProxyAgent } from "https-proxy-agent";
import axios from "axios";

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
    // await sendMail({
    //   to: email,
    //   from: "support",
    //   subject: emailTemplate.subject,
    //   template: emailTemplate.body,
    //   cc: ["orelsmail@gmail.com"],
    // });
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
    console.log("Invalid request", body);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  let { userId, noteId } = parse.data;

  // const textNgrok = await fetch("http://54.84.38.186/api/user/notes/send", {
  //   method: "POST",
  //   body: JSON.stringify(body),
  // });

  // if (textNgrok.ok) {
  //   const data = await textNgrok.json();

  //   // Call self, but in ngrok
  //   return NextResponse.json({ success: data.success, result: data.result });
  // }
  // console.log("textNgrok: " + (await textNgrok.text()));

  try {
    if (!session) {
      // const secret = request.headers.get("x-substack-schedule-secret");
      // if (secret !== process.env.SUBSTACK_SCHEDULE_SECRET) {
      //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // }
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

    console.log("ABout to make adf");

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
    while (retries > 0 && !didSucceed) {
      console.log("About to make fetch");
      try {
        // const proxy =
        //   "http://orelz7_jgRif:8evBfV+LF_x4u=pa@unblock.oxylabs.io:60000";

        // Create the agent
        // const agent = new HttpsProxyAgent(proxy);

        response = await axios.post(
          "https://substack.com/api/v1/comment/feed",
          messageData,
          {
            headers: {
              "content-type": "application/json",
              "sec-ch-ua":
                '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"macOS"',
              Referer: "https://substack.com/home",
              "Referrer-Policy": "strict-origin-when-cross-origin",
              Cookie: `substack.sid=${cookie.value}`,
            },
            // httpsAgent: agent,
          },
        );

        console.log("Ran axios to send note: " + retries + " retries left");
        didSucceed = response.status >= 200 && response.status < 300;
      } catch (error) {
        console.log("Error sending note:", error);
        retries--;
        continue;
      }

      if (!didSucceed) {
        console.log("Request failed with status:", response?.status);
      }
      retries--;
    }

    if (!didSucceed) {
      await sendFailure(note.body, note.id, user.email);
      loggerServer.error(
        "Error to send note: " +
          (response?.statusText || "Unknown error") +
          "response: " +
          JSON.stringify(response?.data || {}) +
          " for note: " +
          noteId +
          " for user: " +
          userId,
      );
      return NextResponse.json(
        {
          error: "Failed to send note: " + JSON.stringify(response?.data || {}),
        },
        { status: 500 },
      );
    }

    const data = response.data as SubstackPostNoteResponse;
    // if contains link, update the note so it removes the OG
    if (
      data.attachments.length > 0 &&
      note.S3Attachment.length === 0 &&
      doesBodyContainLink(note.body)
    ) {
      // path https://substack.com/api/v1/feed/comment/commentId
      try {
        const proxy =
          "http://user-orelz7_r5sBA-country-US:8evBfV+LF_x4u=pa@dc.oxylabs.io:8000";
        const agent = new HttpsProxyAgent(proxy);

        const response = await axios.patch(
          `https://substack.com/api/v1/feed/comment/${data.id}`,
          messageData,
          {
            headers: {
              "Content-Type": "application/json",
              Referer: "https://substack.com/home",
              "Referrer-Policy": "strict-origin-when-cross-origin",
              Cookie: `substack.sid=${cookie.value}`,
            },
            httpsAgent: agent,
          },
        );

        if (response.status >= 400) {
          loggerServer.error(
            "Error to remove OG: " +
              response.statusText +
              " for note: " +
              noteId +
              " for user: " +
              userId,
          );
        }
      } catch (error) {
        loggerServer.error(
          "Error to remove OG: " +
            error +
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
