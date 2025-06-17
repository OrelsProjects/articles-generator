import { extractPostContent } from "@/app/api/user/analyze/_utils";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import TurndownService from "turndown";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateSEOMetadataPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import { runPrompt } from "@/lib/open-router";
import { parseJson } from "@/lib/utils/json";
import { canUseAI, undoUseCredits, useCredits } from "@/lib/utils/credits";
import { decodeKey } from "@/lib/dal/extension-key";

const schema = z.object({
  url: z.string().url(),
});

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-extension-key");
  if (!key) {
    loggerServer.warn("[SAVING-NOTES-STATS] Unauthorized, no extension key", {
      userId: "not logged in",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = decodeKey(key);
  const userId = decoded.userId;
  if (!userId) {
    loggerServer.warn("[SAVING-NOTES-STATS] Unauthorized, no userId in key", {
      userId: "not logged in",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    loggerServer.warn("[SAVING-NOTES-STATS] Unauthorized, no user found", {
      userId,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = request.headers.get("x-api-key");
  if (secret !== process.env.EXTENSION_API_KEY) {
    loggerServer.warn(
      "[SAVING-NOTES-STATS] Unauthorized, bad secret in save notes stats",
      {
        userId,
      },
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let url = "";

  try {
    const canUse = await canUseAI(userId, "seo");

    if (!canUse.result) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: canUse.status },
      );
    }

    const body = await request.json();
    const parsedBody = schema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    url = parsedBody.data.url;
    const { content } = await extractPostContent(url);
    const turndownService = new TurndownService();
    const unmarkedData = turndownService.turndown(content);

    if (!unmarkedData) {
      loggerServer.error("No content found", {
        userId,
        url,
      });
      return NextResponse.json({ error: "No content found" }, { status: 400 });
    }

    await useCredits(userId, "seo");

    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId,
      },
      include: {
        publication: true,
      },
    });

    const messages = generateSEOMetadataPrompt(
      unmarkedData,
      userMetadata,
      userMetadata?.publication,
    );

    const response = await runPrompt(
      messages,
      "openrouter/auto",
      user.name || user.email || user.id || "unknown",
    );

    const data = await parseJson<{
      title: string;
      description: string;
      slug: string;
    }>(response);

    return NextResponse.json(data);
  } catch (error: any) {
    loggerServer.error(error, {
      userId,
      url,
    });
    await undoUseCredits(userId, "seo");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
