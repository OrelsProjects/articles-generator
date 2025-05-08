import { prisma } from "@/lib/prisma";
import { ArticleContent } from "@/lib/dal/milvus";
import { getSubstackArticleData } from "@/lib/utils/article";
import { runPrompt } from "@/lib/open-router";
import { generateFirstMessagePrompt } from "@/lib/prompts";
import { parseJson } from "@/lib/utils/json";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user.meta?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const canonicalUrl = searchParams.get("canonicalUrl");
  let authorName = searchParams.get("authorName") || "";
  let content = searchParams.get("content") || "";
  let article: ArticleContent[] | null = null;

  if (!canonicalUrl && !content) {
    return NextResponse.json(
      { error: "Canonical URL or content is required" },
      { status: 400 },
    );
  }

  if (content) {
    content = content.slice(0, 4000);
  } else if (canonicalUrl) {
    article = await getSubstackArticleData([canonicalUrl]);

    if (article.length === 0 || !article[0].content) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    content = article[0].content.slice(0, 4000);
    authorName = article[0].author?.name?.split(" ")[0]?.trim() || "";
  }

  const prompt = generateFirstMessagePrompt(content, authorName);

  const response = await runPrompt(prompt, "anthropic/claude-3.5-sonnet");

  const { message } = await parseJson<{ message: string }>(response);
  if (canonicalUrl) {
    await prisma.potentialClients.update({
      where: { canonicalUrl },
      data: {
        firstMessage: message,
        authorName: article?.[0]?.author?.name,
        authorUrl: article?.[0]?.author?.url,
      },
    });
  }
  return NextResponse.json({
    message,
    authorName,
    authorUrl: article?.[0]?.author?.url,
  });
}
