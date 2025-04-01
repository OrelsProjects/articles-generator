import { authOptions } from "@/auth/authOptions";
import { fetchAuthor } from "@/lib/lambda";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const env = process.env.NODE_ENV;

const authorizedIds =
  env === "development"
    ? ["67e250196330c8d4fc88149d"]
    : ["67a99e3fb9cbc7c7c5da576d", "67d7cff659df3cb90c4e6a77"];

const schema = z.object({
  authorId: z.string(),
  publicationUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!authorizedIds.includes(session.user.id)) {
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

    await fetchAuthor(options);

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
