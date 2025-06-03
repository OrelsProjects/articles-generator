import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { prisma, prismaArticles } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateNotes } from "@/lib/utils/generate/notes";
import { generateIdeas } from "@/lib/utils/ideas";
import { getAuthorId } from "@/lib/dal/publication";

const toolSchema = z.object({
  tool: z.enum([
    "getUserNotes",
    "getUserArticles",
    "generateNotes",
    "generateArticleIdeas",
  ]),
  params: z
    .object({
      topic: z.string().optional(),
      count: z.number().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { tool, params } = toolSchema.parse(body);
    const authorId = await getAuthorId(session.user.id);

    if (authorId) {
      switch (tool) {
        case "getUserNotes": {
          const notes = await prisma.note.findMany({
            where: {
              authorId: authorId,
              isArchived: false,
            },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              body: true,
              summary: true,
              topics: true,
              status: true,
              scheduledTo: true,
              createdAt: true,
              feedback: true,
            },
            take: 100, // Limit to last 100 notes
          });

          return NextResponse.json({ notes });
        }

        case "getUserArticles": {
          // For now, return ideas as articles (you can modify this based on your article model)
          const bylinePostIds = await prismaArticles.postByline.findMany({
            where: {
              bylineId: authorId,
            },
            select: {
              postId: true,
            },
          });
          const articles = await prismaArticles.post.findMany({
            where: {
              id: { in: bylinePostIds.map(bylinePost => bylinePost.postId) },
            },
            orderBy: { postDate: "desc" },
            select: {
              id: true,
              title: true,
              subtitle: true,
              description: true,
              bodyText: true,
              postDate: true,
            },
            take: 20, // Limit to last 50 articles
          });

          return NextResponse.json({ articles });
        }

        case "generateNotes": {
          const { topic, count } = params || {};
          const result = await generateNotes({
            notesCount: count || 3,
            requestedModel: "auto",
            useTopTypes: false,
            topic: topic || "",
            preSelectedPostIds: [],
          });

          if (!result.success) {
            return NextResponse.json(
              { error: result.errorMessage },
              { status: result.status },
            );
          }

          return NextResponse.json({
            notes: result.data?.responseBody?.body || [],
            creditsUsed: result.data?.responseBody?.creditsUsed,
            creditsRemaining: result.data?.responseBody?.creditsRemaining,
          });
        }

        case "generateArticleIdeas": {
          const { topic, count } = params || {};

          const userMetadata = await prisma.userMetadata.findUnique({
            where: { userId: session.user.id },
            include: { publication: true },
          });

          if (!userMetadata?.publication) {
            return NextResponse.json(
              { error: "Publication metadata not found" },
              { status: 404 },
            );
          }

          const ideas = await generateIdeas(
            session.user.id,
            topic || "",
            userMetadata.publication,
            count || 3,
            "false",
            [],
            {
              modelUsedForIdeas: "anthropic/claude-3.7-sonnet",
              modelUsedForOutline: "anthropic/claude-3.7-sonnet",
            },
            userMetadata,
          );

          return NextResponse.json({ articles: ideas });
        }

        default:
          return new NextResponse("Unknown tool", { status: 400 });
      }
    }
    return new NextResponse("User not found", { status: 404 });
  } catch (error) {
    console.error("Tool execution error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
