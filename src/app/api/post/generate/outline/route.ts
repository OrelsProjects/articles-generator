import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { runPrompt } from "@/lib/open-router";
import { generateOutlinePrompt } from "@/lib/prompts";
import { Article } from "@/types/article";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }
  // try {
  //   const title = req.nextUrl.searchParams.get("title");
  //   const subtitle = req.nextUrl.searchParams.get("subtitle");
  //   if (!title || !subtitle) {
  //     return NextResponse.json(
  //       { error: "Title and subtitle are required" },
  //       { status: 400 },
  //     );
  //   }

  //   const userMetadata = await prisma.userMetadata.findUnique({
  //     where: {
  //       userId: session.user.id,
  //     },
  //     include: {
  //       publication: true,
  //     },
  //   });

  //   const publicationMetadata = userMetadata?.publication;

  //   if (!publicationMetadata || !publicationMetadata.generatedDescription) {
  //     return NextResponse.json(
  //       { error: "User was not initialized" },
  //       { status: 403 },
  //     );
  //   }
  //   const inspirations = await axios.get<Article[]>(
  //     `http://localhost:3002/search?q=title:${title} AND subtitle:${subtitle}&limit=20&includeBody=true`,
  //   );

  //   const userArticlesResponse = await axios.get<Article[]>(
  //     `http://localhost:3002/get-user-articles?substackUrl=${publicationMetadata.publicationUrl}&limit=10&includeBody=true`,
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     },
  //   );

  //   const messages = generateOutlinePrompt(
  //     title,
  //     subtitle,
  //     publicationMetadata.generatedDescription,
  //     inspirations.data,
  //   );

  //   const outlineString = await runPrompt(
  //     messages,
  //     "anthropic/claude-3.5-sonnet",
  //   );

  //   let outline: any | null = null;

  //   try {
  //     const sanitizedString = outlineString.replace(/\r?\n/g, "\\n");
  //     outline = JSON.parse(sanitizedString) as { outline: string };
  //   } catch (error: any) {
  //     console.error(error);
  //   }

  //   return NextResponse.json({
  //     outline: outline?.outline,
  //     title,
  //     subtitle,
  //   });
  return NextResponse.json({
    outline: "outline",
    title: "title",
    subtitle: "subtitle",
  });
  // } catch (error: any) {
  //   console.error(error);
  //   return NextResponse.json(
  //     { error: "Internal Server Error" },
  //     { status: 500 },
  //   );
  // }
}
