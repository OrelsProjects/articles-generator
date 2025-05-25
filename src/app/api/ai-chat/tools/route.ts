import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const toolSchema = z.object({
  tool: z.enum(['getUserNotes', 'getUserArticles']),
  params: z.object({}).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { tool, params } = toolSchema.parse(body);

    switch (tool) {
      case 'getUserNotes': {
        const notes = await prisma.note.findMany({
          where: {
            userId: session.user.id,
            isArchived: false,
          },
          orderBy: { createdAt: 'desc' },
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

      case 'getUserArticles': {
        // For now, return ideas as articles (you can modify this based on your article model)
        const articles = await prisma.idea.findMany({
          where: {
            userId: session.user.id,
            status: { not: 'archived' },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            subtitle: true,
            description: true,
            body: true,
            topic: true,
            status: true,
            createdAt: true,
          },
          take: 50, // Limit to last 50 articles
        });

        return NextResponse.json({ articles });
      }

      default:
        return new NextResponse("Unknown tool", { status: 400 });
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 