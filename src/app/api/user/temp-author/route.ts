import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let authorId = session?.user.meta?.tempAuthorId || null;
  if (!authorId && session) {
    const userAuthorId = await prisma.userMetadata.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        publication: {
          select: {
            authorId: true,
          },
        },
      },
    });
    authorId = userAuthorId?.publication?.authorId?.toString() || null;
  }
  return NextResponse.json(authorId, { status: 200 });
}
