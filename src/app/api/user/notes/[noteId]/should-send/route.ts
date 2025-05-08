import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Check if note is in schedule status
    const note = await prisma.note.findUnique({
      where: {
        id: params.noteId,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.status !== "scheduled") {
      return NextResponse.json(
        { error: "Note is not scheduled" },
        { status: 400 },
      );
    }

    return NextResponse.json({ shouldSend: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
