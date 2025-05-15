import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { fetchAuthor } from "@/lib/utils/lambda";
import { FeatureFlag } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import loggerServer from "@/loggerServer";

const schema = z.object({
  authorId: z.string(),
  publicationUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user.meta?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userMetadata = await prisma.userMetadata.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!userMetadata?.featureFlags.includes(FeatureFlag.populateNotes)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { success, data } = schema.safeParse(body);
    if (!success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!data.authorId && !data.publicationUrl) {
      return NextResponse.json(
        { error: "Author ID or publication URL is required" },
        { status: 400 },
      );
    }
    const options = {
      authorId: data.authorId,
      publicationUrl: data.publicationUrl,
    };

    const now = new Date();
    loggerServer.info("[FETCH WRITER] Fetching author", {
      authorId: options.authorId,
      publicationUrl: options.publicationUrl,
      userId: session.user.id,
    });

    await fetchAuthor(options);
    const end = new Date();
    const timeToFetchSeconds = (end.getTime() - now.getTime()) / 1000;
    loggerServer.info("[FETCH WRITER] Fetched author in" + timeToFetchSeconds + "seconds", {
      authorId: options.authorId,
      publicationUrl: options.publicationUrl,
      userId: session.user.id,
    });

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
