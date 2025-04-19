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

    const anotherTry = await fetch("https://substack.com/api/v1/comment/feed", {
      headers: {
        accept: "*/*",
        "accept-language":
          "en-US,en;q=0.9,he-IL;q=0.8,he;q=0.7,sv-SE;q=0.6,sv;q=0.5",
        "cache-control": "max-age=0",
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie: [
          cookieSubstackSid.value,
          cookieCfBm.value,
          cookieLli.value,
          "%220b0a460b-cde8-4fc9-aa44-3c0e0f39b4d1%22",
        ].join("; "),
        // "ab_testing_id=%220b0a460b-cde8-4fc9-aa44-3c0e0f39b4d1%22; _gcl_au=1.1.68874281.1739957939; _ga=GA1.1.228826498.1739957939; _ga_EB1RYY5184=GS1.1.1740123604.1.0.1740123610.0.0.0; _ga_QMBMRERF75=GS1.1.1740496751.1.0.1740496759.52.0.0; _ga_9LZXB2MSXF=GS1.1.1740504620.3.1.1740504980.0.0.0; ab_experiment_sampled=%22false%22; _ga_S16PBPEEPF=GS1.1.1740730321.1.0.1740730399.0.0.0; _ga_GKN0C5KN3T=GS1.1.1740730534.1.0.1740730620.0.0.0; _ga_G4Q75FKESP=GS1.1.1740730530.1.1.1740730689.0.0.0; _ga_HT94TWX9T6=GS1.1.1741630169.1.0.1741630169.0.0.0; _ga_9SZSGF8MMZ=GS1.1.1741632623.3.0.1741632623.0.0.0; _ga_JDHJPTMPQP=GS1.1.1741676743.1.1.1741676782.0.0.0; _ga_1T0C18FW42=GS1.1.1741874275.2.0.1741874275.0.0.0; _ga_5H3R8TFHGW=GS1.1.1742052665.1.0.1742052666.0.0.0; _ga_8YK2X3Q7FY=GS1.1.1742136575.3.1.1742137452.0.0.0; _ga_QWVCE6QQPC=GS1.1.1742212569.5.1.1742212600.0.0.0; _ga_R27PC56396=GS1.1.1742312552.2.0.1742312557.0.0.0; _ga_0368MQFBYW=GS1.1.1742483711.1.1.1742483750.0.0.0; _ga_K335T5VCQV=GS1.1.1742652917.1.1.1742652973.0.0.0; _ga_BD0352VLNZ=GS1.1.1742659678.10.1.1742659759.0.0.0; ajs_anonymous_id=%2211ba91d0-fc07-4e51-be89-ba699e60d2c3%22; _ga_RRFLLHFZFN=GS1.1.1743011052.1.0.1743011052.0.0.0; _ga_RB02GKCMSX=GS1.1.1743491328.3.1.1743491332.0.0.0; substack.sid=s%3AMFg2iWxUQGabPyG3qa9Zm-tP57nHNcf5.39mXTUkD9U9HhIomoe6x91smLuRQnS6IaObWQ0dR0A8; _ga_DY2HSGXPE5=GS1.1.1744122628.1.0.1744122628.0.0.0; _ga_468TD7V98R=GS1.1.1744784127.2.0.1744784127.0.0.0; _ga_JB7SWX1F6V=GS1.1.1745044310.9.1.1745044334.0.0.0; _ga_0WN8633M2V=GS1.1.1745044250.2.0.1745045240.0.0.0; substack.lli=1; muxData=mux_viewer_id=5951c060-2ea7-4c5c-8507-98a79a099d56&msn=0.549384920052808&sid=9e9ad7fb-d342-468c-8307-0f8258dc2b4e&sst=1745062969458&sex=1745065747942; cf_clearance=mdrvkaQKqnWJ36ExXH29D1SErweDuidIOiWY6bDB20w-1745090797-1.2.1.1-_mWT1RD6hbG48mfGOKZlW6E7rpIluhcsSCN5joxPzoGchlSjTTeSuZS1WoMx0aiVPGjegiWcj8kGsRtuH0m1mS_mM95FtEJdWF3KMmbz0dlVbXIy8IgdQrASfy85ttpOhDFUxlbudi9uCjWc0OzUvpvHbqQU7BuAYWGH3p9tVWu.WNF026vc_ipSh9tlgfLp1FiRGL1NB19w86ksdOB8euuqDCw03fwt0JHtZVlSy1ecZGYnbkvo8tHmHvU0_T3SFZTvbKvMXd2bYs87XaaxcYqLgwMKGpxp5kX7GIg4TVF3oAuishohsZ_dIth5cRjM58kYLIItknmFH8ZyGJu.v.vNoQh1vKwhXkgVKXuS3wE; __cf_bm=7RmrYWhv4Ypt1t6leYfL23RLb8rDlAZt5wCS7Pw24ek-1745090950-1.0.1.1-VXcIvr0kJjBCCZ4HnCHT29scm2c7IyKM61IgP0fAoHOP9enk47cn5vO6h1fLrdd4gu3Pr2Nm7krM_9O49qDvhc3fDNgIoGwK8saPSs1A6RI; visit_id=%7B%22id%22%3A%2210322605-337d-4b93-b0ef-5a59320920b6%22%2C%22timestamp%22%3A%222025-04-19T19%3A33%3A41.857Z%22%7D; _ga_TLW0DF6G5V=GS1.1.1745086101.409.1.1745091249.0.0.0; AWSALBTG=jQung5cXsv38w79dFvEttyvOgenmUWojlrvebGXirAkC1+TiEjQOMRo7QrZ4eHbpBEj7onZj1gWJQAQQ2qq+hrQuFlOtQNfTZIiMgtykYlx7Em8qlUbJAW6fePdcYGYNWh1wN7EWXPaBqjnFvYY+PTNKoKnnOCNSCl+8BqL5OCYI; AWSALBTGCORS=jQung5cXsv38w79dFvEttyvOgenmUWojlrvebGXirAkC1+TiEjQOMRo7QrZ4eHbpBEj7onZj1gWJQAQQ2qq+hrQuFlOtQNfTZIiMgtykYlx7Em8qlUbJAW6fePdcYGYNWh1wN7EWXPaBqjnFvYY+PTNKoKnnOCNSCl+8BqL5OCYI; _dd_s=rum=0&expire=1745092153212",
        Referer: "https://substack.com/home?",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: JSON.stringify(messageData),
      method: "POST",
    });

    console.log("Another try test");
    const isAnotherTry = anotherTry.ok;
    console.log("Is another try: " + isAnotherTry);
    if (!isAnotherTry) {
      console.log("Another try failed");
      const text = await anotherTry.text();
      console.log("Another try text: " + text);
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
