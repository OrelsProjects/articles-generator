import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { isIdeaBelongToUser } from "@/lib/dal/ideas";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  params: {
    params: {
      ideaId: string;
    };
  },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const { ideaId } = params.params;
    const { body, title, subtitle } = await request.json();
    const isValidRequest = await isIdeaBelongToUser(ideaId, session.user.id);

    if (!isValidRequest) {
      return new Response("Unauthorized", { status: 401 });
    }

    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: { title, subtitle, body },
    });

    return NextResponse.json(idea);
  } catch (error: any) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
