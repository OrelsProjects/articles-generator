import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      // Get specific chat with messages
      const chat = await prisma.aIChat.findUnique({
        where: {
          id: chatId,
          userId: session.user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          }
        }
      });

      if (!chat) {
        return new NextResponse("Chat not found", { status: 404 });
      }

      return NextResponse.json(chat);
    } else {
      // Get all chats for the user (without messages)
      const chats = await prisma.aIChat.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: { lastMessageAt: 'desc' },
        take: 50, // Limit to last 50 chats
      });

      return NextResponse.json(chats);
    }
  } catch (error) {
    console.error('Chat history error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 