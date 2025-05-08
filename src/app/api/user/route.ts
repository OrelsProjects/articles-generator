import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/auth/authOptions";
import AppUser from "@/types/appUser";
import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { checkAndResetCredits } from "@/lib/services/creditService";
import { deleteScheduleForNote } from "@/lib/dal/note-schedule";
import { cancelSubscription } from "@/lib/stripe";
import { getActiveSubscription } from "@/lib/dal/subscription";

export async function GET(req: NextRequest): Promise<any> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check and reset credits if needed
    if (session.user?.id) {
      const updatedCredits = await checkAndResetCredits(session.user.id);

      // If credits were updated, we should update the session user's metadata
      if (updatedCredits.credits > 0) {
        // We don't need to modify the session directly as it will be refreshed on next request
        // But we could log that credits were reset
        loggerServer.info("Credits were reset for user", {
          userId: session.user.id,
          credits: updatedCredits.credits,
        });
      }
    }

    // Return user data
    return NextResponse.json(
      {
        user: session.user,
      },
      { status: 200 },
    );
  } catch (error: any) {
    loggerServer.error("Error fetching user data", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<any> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let user: AppUser | null = null;
  try {
    const { user: sessionUser } = session;
    const body = await req.json();
    user = body as AppUser;
    user.email = sessionUser?.email || user.email;
    user.image = sessionUser?.image || user.image;
  } catch (error: any) {
    loggerServer.error("Error initializing logger", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<any> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    if (!session.user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userSchedules = await prisma.scheduledNote.findMany({
      where: {
        userId: session.user?.id,
      },
    });

    // Delete all schedules for the user
    if (userSchedules.length > 0) {
      for (const schedule of userSchedules) {
        await deleteScheduleForNote(schedule.noteId);
      }
    }

    // cancel subscription
    const subscription = await getActiveSubscription(session.user?.id);
    if (subscription) {
      await cancelSubscription(subscription.stripeSubId);
    }
    await prisma.user.delete({
      where: { id: session.user?.id },
    });
    return NextResponse.json({}, { status: 200 });
  } catch (error: any) {
    loggerServer.error("[CRITICAL] Error deleting user", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
