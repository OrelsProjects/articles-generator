import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  language: z.string().min(2).max(2),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      loggerServer.error("[UPDATE LANGUAGE] Invalid request", {
        userId: session.user.id,
        error: parsed.error,
      });
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { language } = parsed.data;
    await prisma.userMetadata.update({
      where: {
        userId: session.user.id,
      },
      data: {
        preferredLanguage: language,
      },
    });
    return NextResponse.json({ message: "Language updated" });
  } catch (error) {
    loggerServer.error("[UPDATE LANGUAGE] Internal server error", {
      userId: session.user.id,
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
