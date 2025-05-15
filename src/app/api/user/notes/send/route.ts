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
import axiosInstance from "@/lib/axios-instance";
import https from "https";

import { request as undiciRequest } from "undici";

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
    // if (note.status === "published" && !session) {
    //   return NextResponse.json(
    //     { error: "Note already published" },
    //     { status: 400 },
    //   );
    // }

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
    const agent = new https.Agent({
      minVersion: "TLSv1.3",
      maxVersion: "TLSv1.3",
    });


    let data = JSON.stringify({
      bodyJson: {
        type: "doc",
        attrs: {
          schemaVersion: "v1",
        },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "hELLLO",
              },
            ],
          },
        ],
      },
      tabId: "for-you",
      surface: "feed",
      replyMinimumRole: "everyone",
    });

    const { statusCode, body } = await undiciRequest(
      "https://substack.com/api/v1/comment/feed",
      {
        method: "POST",
        headers: {
          Cookie: `substack.sid=${cookie.value}`,
          "User-Agent": "PostmanRuntime",
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ ...messageData }),
      },
    );

    loggerServer.info("statusCode", { statusCode, userId });
    loggerServer.info("body", { body, userId });

    //     let config = {
    //       method: "post",
    //       maxBodyLength: Infinity,
    //       url: "https://substack.com/api/v1/comment/feed",
    //       headers: {
    //         Cookie:
    //           "ab_experiment_sampled=%22false%22; ab_testing_id=%22aa57ed05-f1b8-47f4-ae28-427c2198ed0f%22; _ga=GA1.1.2124865279.1740567454; ajs_anonymous_id=%22db42b08cd36817fc48b2eb847d03f18b%22; visit_id=%7B%22id%22%3A%22f3d8961e-363e-4ca0-a893-e6882c3844a1%22%2C%22timestamp%22%3A%222025-05-14T12%3A27%3A24.271Z%22%2C%22utm_source%22%3A%22user-menu%22%7D; cookie_storage_key=c436a61d-0dbb-4887-8df5-df04ceca0844; substack.sid=s%3AwsBdjTw1S3Nj0CUhQ9DzFg8hHQpyfLgL.NZSMKWWw9rsEPQK6Q6gkUGR6s3BbXJwMRRW4o9ST%2Bm0; _gcl_au=1.1.521878127.1740567455.2023779881.1747225891.1747225890; substack.lli=1; muxData=mux_viewer_id=55530071-756b-4cf3-a193-fb467a223d4b&msn=0.6445045854474556&sid=acf6dbc8-f09d-4ec3-8cfd-187061d77a07&sst=1747225328461&sex=1747227548401; __cf_bm=uTguFxtxk6xXhcF90WoN1mT1oKe6ZGH_cXhRUlmjI20-1747228975-1.0.1.1-coybeLngsapqnqNk9.agSIQcGYSgCiIeuTNMTgD5LKdZmqWtAx6FH1W2jhlELGSAQSmHO6iryEB7rlNO7wECHR0lRYBx78P3m3h9Z6v29hk; cf_clearance=R4.zZW5ZJGtJl4DIrADAK9JpRdbs7uuVDXpgJqOGh6w-1747228976-1.2.1.1-G3BmMKfSiMIal03aTgKZ.QSRs7RDAnKgUOL0FW4PjlSC8jlnOBmWm5xZbJuNvJ_NQYr0FWFFtS7mIPi.ayKE0z86sOQWX1hfD1gDbM5DQqvgTEiIu.z79R6DcdGJiyh3P.x_SaW6tCc2bdTELag4ycJWwekfshyuDG1cxWaxHPcbosvNw6FH0D3Nvy4spjHPXrOqBSaptHmpwNzFLTDyBiS6cLXQ1lMxKzK66LO2Kh1WoSSBnKMz.1C1732hhMduQpZixbsP6fXKysAWnmy66eySNvr1Nscus3jIr_8fTgUbmjPCF1q9YsMM6T92oVXbuRqljll55S_fQkTMK5Xserex4L9Zru5BLQs_hhZ5HNM; _ga_TLW0DF6G5V=GS2.1.s1747225271$o29$g1$t1747229223$j0$l0$h0; AWSALBTG=7m2C6+kCiTv3iKhOexSqpEBVQKhTULVva/3Mze+HatJ5FQPjsO2J6BNPtFukM9IjBUU61fpSyFRjhavUbGvPz18tbztRFATEbsFrcuIwYh4DTalExAwef0975oxticppZmeZSAIbZj6sy+/8M8NM9gy1XZ/zSB5x2q1IbLT5yeHb; AWSALBTGCORS=7m2C6+kCiTv3iKhOexSqpEBVQKhTULVva/3Mze+HatJ5FQPjsO2J6BNPtFukM9IjBUU61fpSyFRjhavUbGvPz18tbztRFATEbsFrcuIwYh4DTalExAwef0975oxticppZmeZSAIbZj6sy+/8M8NM9gy1XZ/zSB5x2q1IbLT5yeHb; _dd_s=rum=0&expire=1747230124908; AWSALBTG=RnT0IMlu/s2hQZUKEq/k0kt2bcb3fGOpdm60LZNwcpZzg44Ix6DyJv/rY3lHYQcYBHxE62ikZk4KRB7lKWa9qDhglyLovFzna3pJvxB8mn/jZDMDO8ZwfLh9A4aBr0s3bVJf7RzfjbvVA5x2u7Oow6WHGViutAYimTd9np6SRdFd; AWSALBTGCORS=RnT0IMlu/s2hQZUKEq/k0kt2bcb3fGOpdm60LZNwcpZzg44Ix6DyJv/rY3lHYQcYBHxE62ikZk4KRB7lKWa9qDhglyLovFzna3pJvxB8mn/jZDMDO8ZwfLh9A4aBr0s3bVJf7RzfjbvVA5x2u7Oow6WHGViutAYimTd9np6SRdFd; __cf_bm=2lhKr53bu53u6jY0BKXgBLU7QywQ.Tmf2iKAsKC_sHg-1747229544-1.0.1.1-8BXt8njfx4wfvt36wGxX00stHYO7XnSmvtRs1lgzBYgtxS82Pz8E_5UbNGLRq7sRiQk5Mfs7vjF_xjCSpj7kBSmJwIUDhFaoi.Mo_JOH.Ts; ab_testing_id=%22aa57ed05-f1b8-47f4-ae28-427c2198ed0f%22; ajs_anonymous_id=%22db42b08cd36817fc48b2eb847d03f18b%22; substack.sid=s%3AwsBdjTw1S3Nj0CUhQ9DzFg8hHQpyfLgL.NZSMKWWw9rsEPQK6Q6gkUGR6s3BbXJwMRRW4o9ST%2Bm0; visit_id=%7B%22id%22%3A%22f3d8961e-363e-4ca0-a893-e6882c3844a1%22%2C%22timestamp%22%3A%222025-05-14T12%3A27%3A24.271Z%22%2C%22utm_source%22%3A%22user-menu%22%7D",
    //         "Content-Type": "application/json",
    //         "User-Agent": "PostmanRuntime/7.43.4",
    //         Accept: "*/*",
    //         "Accept-Encoding": "gzip, deflate, br",
    //         Connection: "keep-alive",
    //         "Cache-Control": "no-cache",
    //       },
    //       data: data,
    //     };


    //     const response = await fetch(
    //       "https://substack.com/api/v1/comment/feed",
    //       {
    //         headers: {
    //           accept: "*/*",
    //           "accept-language": "en-US,en;q=0.9",
    //           "cache-control": "no-cache",
    //           "content-type": "application/json",
    //           pragma: "no-cache",
    //           priority: "u=1, i",
    //           "sec-ch-ua":
    //             '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    //           "sec-ch-ua-mobile": "?0",
    //           "sec-ch-ua-platform": '"macOS"',
    //           "sec-fetch-dest": "empty",
    //           "sec-fetch-mode": "cors",
    //           "sec-fetch-site": "same-origin",
    //           cookie:
    //             "ab_experiment_sampled=%22false%22; ab_testing_id=%22aa57ed05-f1b8-47f4-ae28-427c2198ed0f%22; _ga=GA1.1.2124865279.1740567454; ajs_anonymous_id=%22db42b08cd36817fc48b2eb847d03f18b%22; visit_id=%7B%22id%22%3A%22f3d8961e-363e-4ca0-a893-e6882c3844a1%22%2C%22timestamp%22%3A%222025-05-14T12%3A27%3A24.271Z%22%2C%22utm_source%22%3A%22user-menu%22%7D; cookie_storage_key=c436a61d-0dbb-4887-8df5-df04ceca0844; substack.sid=s%3AwsBdjTw1S3Nj0CUhQ9DzFg8hHQpyfLgL.NZSMKWWw9rsEPQK6Q6gkUGR6s3BbXJwMRRW4o9ST%2Bm0; _gcl_au=1.1.521878127.1740567455.2023779881.1747225891.1747225890; substack.lli=1; muxData=mux_viewer_id=55530071-756b-4cf3-a193-fb467a223d4b&msn=0.6445045854474556&sid=acf6dbc8-f09d-4ec3-8cfd-187061d77a07&sst=1747225328461&sex=1747227548401; __cf_bm=uTguFxtxk6xXhcF90WoN1mT1oKe6ZGH_cXhRUlmjI20-1747228975-1.0.1.1-coybeLngsapqnqNk9.agSIQcGYSgCiIeuTNMTgD5LKdZmqWtAx6FH1W2jhlELGSAQSmHO6iryEB7rlNO7wECHR0lRYBx78P3m3h9Z6v29hk; cf_clearance=R4.zZW5ZJGtJl4DIrADAK9JpRdbs7uuVDXpgJqOGh6w-1747228976-1.2.1.1-G3BmMKfSiMIal03aTgKZ.QSRs7RDAnKgUOL0FW4PjlSC8jlnOBmWm5xZbJuNvJ_NQYr0FWFFtS7mIPi.ayKE0z86sOQWX1hfD1gDbM5DQqvgTEiIu.z79R6DcdGJiyh3P.x_SaW6tCc2bdTELag4ycJWwekfshyuDG1cxWaxHPcbosvNw6FH0D3Nvy4spjHPXrOqBSaptHmpwNzFLTDyBiS6cLXQ1lMxKzK66LO2Kh1WoSSBnKMz.1C1732hhMduQpZixbsP6fXKysAWnmy66eySNvr1Nscus3jIr_8fTgUbmjPCF1q9YsMM6T92oVXbuRqljll55S_fQkTMK5Xserex4L9Zru5BLQs_hhZ5HNM; _ga_TLW0DF6G5V=GS2.1.s1747225271$o29$g1$t1747229223$j0$l0$h0; AWSALBTG=7m2C6+kCiTv3iKhOexSqpEBVQKhTULVva/3Mze+HatJ5FQPjsO2J6BNPtFukM9IjBUU61fpSyFRjhavUbGvPz18tbztRFATEbsFrcuIwYh4DTalExAwef0975oxticppZmeZSAIbZj6sy+/8M8NM9gy1XZ/zSB5x2q1IbLT5yeHb; AWSALBTGCORS=7m2C6+kCiTv3iKhOexSqpEBVQKhTULVva/3Mze+HatJ5FQPjsO2J6BNPtFukM9IjBUU61fpSyFRjhavUbGvPz18tbztRFATEbsFrcuIwYh4DTalExAwef0975oxticppZmeZSAIbZj6sy+/8M8NM9gy1XZ/zSB5x2q1IbLT5yeHb; _dd_s=rum=0&expire=1747230124908",
    //           Referer: "https://substack.com/home",
    //           "Referrer-Policy": "strict-origin-when-cross-origin",
    //         },
    //         body: '{"bodyJson":{"type":"doc","attrs":{"schemaVersion":"v1"},"content":[{"type":"paragraph","content":[{"type":"text","text":"test"}]}]},"tabId":"for-you","surface":"feed","replyMinimumRole":"everyone"}',
    //         method: "POST",
    //       },
    //     );

    //     didSucceed = response.status >= 200 && response.status < 300;
    //   } catch (error) {
    //     console.log("Error sending note:", error);
    //     retries--;
    //     continue;
    //   }

    //   if (!didSucceed) {
    //     console.log("Request failed with status:", response?.status);
    //   }
    //   retries--;
    // }

    // if (!didSucceed) {
    //   await sendFailure(note.body, note.id, user.email);
    //   loggerServer.error(
    //     "Error to send note: " +
    //       (response?.statusText || "Unknown error") +
    //       "response: " +
    //       JSON.stringify(response?.data || {}) +
    //       " for note: " +
    //       noteId +
    //       " for user: " +
    //       userId,
    //   );
    //   return NextResponse.json(
    //     {
    //       error: "Failed to send note: " + JSON.stringify(response?.data || {}),
    //     },
    //     { status: 500 },
    //   );
    // }

    // const data = response.data as SubstackPostNoteResponse;
    // // if contains link, update the note so it removes the OG
    // if (
    //   data.attachments.length > 0 &&
    //   note.S3Attachment.length === 0 &&
    //   doesBodyContainLink(note.body)
    // ) {
    //   // path https://substack.com/api/v1/feed/comment/commentId
    //   try {
    //     const proxy =
    //       "http://user-orelz7_r5sBA-country-US:8evBfV+LF_x4u=pa@dc.oxylabs.io:8000";
    //     const agent = new HttpsProxyAgent(proxy);

    //     const response = await .patch(
    //       `https://substack.com/api/v1/feed/comment/${data.id}`,
    //       messageData,
    //       {
    //         headers: {
    //           "Content-Type": "application/json",
    //           Referer: "https://substack.com/home",
    //           "Referrer-Policy": "strict-origin-when-cross-origin",
    //           Cookie: `substack.sid=${cookie.value}`,
    //         },
    //         httpsAgent: agent,
    //       },
    //     );

    //     if (response.status >= 400) {
    //       loggerServer.error(
    //         "Error to remove OG: " +
    //           response.statusText +
    //           " for note: " +
    //           noteId +
    //           " for user: " +
    //           userId,
    //       );
    //     }
    //   } catch (error) {
    //     loggerServer.error(
    //       "Error to remove OG: " +
    //         error +
    //         " for note: " +
    //         noteId +
    //         " for user: " +
    //         userId,
    //     );
    //   }
    // }

    // await prisma.note.update({
    //   where: {
    //     id: noteId,
    //   },
    //   data: {
    //     sentViaScheduleAt: note.scheduledTo ? new Date() : undefined,
    //     status: "published",
    //   },
    // });

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
