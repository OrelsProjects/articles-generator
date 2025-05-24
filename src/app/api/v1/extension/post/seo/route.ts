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

const schema = z.object({
  url: z.string().url(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let url = "";

  try {
    const canUse = await canUseAI(session.user.id, "seo");

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
        userId: session.user.id,
        url,
      });
      return NextResponse.json({ error: "No content found" }, { status: 400 });
    }

    await useCredits(session.user.id, "seo");

    const userMetadata = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
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
      session.user.name || session.user.email || session.user.id || "unknown",
    );

    const data = await parseJson<{
      title: string;
      description: string;
      slug: string;
    }>(response);

    return NextResponse.json(data);
  } catch (error: any) {
    loggerServer.error(error, {
      userId: session.user.id,
      url,
    });
    await undoUseCredits(session.user.id, "seo");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
