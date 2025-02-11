import prisma from "@/app/api/_db/db";
import { getSubstackArticleData } from "@/lib/dal/milvus";
import { runPrompt } from "@/lib/openRouter";
import { generateFirstMessagePrompt } from "@/lib/prompts";
import { parseJson } from "@/lib/utils/json";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const canonicalUrl = searchParams.get("canonicalUrl");
  if (!canonicalUrl) {
    return NextResponse.json(
      { error: "Canonical URL is required" },
      { status: 400 },
    );
  }

  const article = await getSubstackArticleData([canonicalUrl]);

  if (article.length === 0 || !article[0].content) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const trimmedContent = article[0].content.slice(0, 2000);

  const prompt = generateFirstMessagePrompt(trimmedContent);

  const response = await runPrompt(prompt, "anthropic/claude-3.5-sonnet");

  const { message } = await parseJson<{ message: string }>(response);

  await prisma.potentialClients.update({
    where: { canonicalUrl },
    data: { firstMessage: message },
  });

  return NextResponse.json({ message });
}
