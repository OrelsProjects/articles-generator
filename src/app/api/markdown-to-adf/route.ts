import { getNoteById } from "@/lib/dal/note";
import { bodyJsonToSubstackBody, markdownToADF } from "@/lib/utils/adf";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  markdown: z.string(),
  noteId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedBody = schema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    const { markdown, noteId } = parsedBody.data;

    if (noteId) {
      const note = await getNoteById(noteId);
      if (note && note.bodyJson) {
        const bodyJson = JSON.parse(note.bodyJson);
        const adf = bodyJsonToSubstackBody(bodyJson);
        return NextResponse.json(adf);
      }
    }

    if (typeof markdown !== "string") {
      return NextResponse.json(
        { error: "Invalid markdown input" },
        { status: 400 },
      );
    }

    const adf = await markdownToADF(markdown);

    return NextResponse.json(adf);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", detail: err.message },
      { status: 500 },
    );
  }
}
