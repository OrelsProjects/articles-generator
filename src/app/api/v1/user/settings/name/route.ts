import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(99),
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      loggerServer.error("[UPDATE NAME] Invalid request", {
        userId: session.user.id,
        error: parsed.error,
      });
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { name } = parsed.data;
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
      },
    });
    return NextResponse.json({ message: "Name updated" });
  } catch (error) {
    loggerServer.error("[UPDATE NAME] Internal server error", {
      userId: session.user.id,
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
