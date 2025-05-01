import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_db/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { scheduleId: string } },
) {
  const { scheduleId } = params;
  const schedule = await prisma.scheduledNote.findUnique({
    where: {
      id: scheduleId,
    },
  });

  if (!schedule) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  // If the schedule is in the past, more than 10 minutes ago, return false
  if (schedule.scheduledAt <= new Date(Date.now() - 10 * 60 * 1000)) {
    return NextResponse.json(
      { canPost: false, error: "Schedule was missed" },
      { status: 200 },
    );
  }

    return NextResponse.json({ canPost: true }, { status: 200 });
}
