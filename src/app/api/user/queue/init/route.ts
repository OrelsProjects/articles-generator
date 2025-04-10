import { authOptions } from "@/auth/authOptions";
import { createDefaultUserSchedule } from "@/lib/dal/user-schedule";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const userSchedules = await createDefaultUserSchedule(session.user.id);
    return NextResponse.json(userSchedules);
  } catch (error: any) {
    loggerServer.error(error);
    return NextResponse.json(
      { error: "Failed to initialize user schedule" },
      { status: 500 },
    );
  }
}
