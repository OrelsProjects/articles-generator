import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { UserSchedule } from "@/types/schedule";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUserSchedule, getUserSchedules } from "@/lib/dal/queue";
import { GhostwriterDAL } from "@/lib/dal/ghostwriter";

const scheduleSchemaPost = z.object({
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
  clientId: z.string().optional().nullable(),
});


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clientId = request.nextUrl.searchParams.get("clientId");
    let userSchedules: UserSchedule[] = [];

    if (clientId) {
      const canRun = await GhostwriterDAL.canRunOnBehalfOf({
        ghostwriterUserId: session.user.id,
        clientId,
      });

      if (!canRun) {
        return NextResponse.json(
          { error: "Unauthorized ghostwriter access" },
          { status: 403 },
        );
      }

      userSchedules = await getUserSchedules(clientId);
      return NextResponse.json(userSchedules);
    } else {
      userSchedules = await getUserSchedules(session.user.id);
    }

    return NextResponse.json(userSchedules);
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
    const schedule = scheduleSchemaPost.safeParse(body);
    if (!schedule.success) {
      return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
    }

    let userSchedule: UserSchedule | null = null;
    const { clientId, ...rest } = schedule.data;

    if (body.clientId) {
      const canRun = await GhostwriterDAL.canRunOnBehalfOf({
        ghostwriterUserId: session.user.id,
        clientId: body.clientId,
      });
      if (!canRun) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      const scheduleData = {
        ...rest,
        ghostwriterUserId: null
      };

      userSchedule = await createUserSchedule(scheduleData, body.clientId);
    } else {
      const scheduleData = {
        ...rest,
        userId: session.user.id,
        ghostwriterUserId: null,
      };
      userSchedule = await createUserSchedule(scheduleData, session.user.id);
    }

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
