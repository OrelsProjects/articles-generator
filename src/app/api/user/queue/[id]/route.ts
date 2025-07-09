import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { UserSchedule } from "@/types/schedule";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GhostwriterDAL } from "@/lib/dal/ghostwriter";
import { isOwnerOfSchedule, updateUserSchedule } from "@/lib/dal/queue";

const scheduleSchema = z.object({
  sunday: z.boolean(),
  monday: z.boolean(),
  tuesday: z.boolean(),
  wednesday: z.boolean(),
  thursday: z.boolean(),
  friday: z.boolean(),
  saturday: z.boolean(),
  hour: z.number(),
  minute: z.number(),
  ampm: z.enum(["am", "pm"]),
  ghostwriterUserId: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const schedule = scheduleSchema.safeParse(await request.json());
  
    if (!schedule.success) {
      return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
    }

    const isOwner = await isOwnerOfSchedule(params.id, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedSchedule = await updateUserSchedule({
      ...schedule.data,
      id: params.id,
      ghostwriterUserId: schedule.data.ghostwriterUserId || null,
    });

    return NextResponse.json(updatedSchedule);
  } catch (error: any) {
    loggerServer.error("Error updating schedule", {
      error,
      userId: session.user.id,
      id: params.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const isOwner = await isOwnerOfSchedule(params.id, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await prisma.userSchedule.delete({
      where: {
        id: params.id,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    loggerServer.error("Error deleting schedule", {
      error,
      userId: session.user.id,
      id: params.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
