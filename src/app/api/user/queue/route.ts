import { prisma } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { UserSchedule } from "@/types/schedule";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userSchedules = await prisma.userSchedule.findMany({
      where: {
        userId: session.user.id,
      },
    });

    const response: UserSchedule[] = userSchedules.map(schedule => ({
      id: schedule.id,
      sunday: schedule.sunday,
      monday: schedule.monday,
      tuesday: schedule.tuesday,
      wednesday: schedule.wednesday,
      thursday: schedule.thursday,
    friday: schedule.friday,
      saturday: schedule.saturday,
      hour: schedule.hour,
      minute: schedule.minute,
      ampm: schedule.ampm,
    }));

    return NextResponse.json(response);
  } catch (error: any) {
    loggerServer.error("Error getting user schedules", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const schedule = scheduleSchema.safeParse(body);
    if (!schedule.success) {
      return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
    }

    const userSchedule = await prisma.userSchedule.create({
      data: {
        userId: session.user.id,
        ...schedule.data,
      },
    });

    return NextResponse.json(userSchedule);
  } catch (error: any) {
    loggerServer.error("Error creating user schedule", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
