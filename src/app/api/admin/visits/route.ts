import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.meta?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all visits with user information
    const visits = await prisma.visits.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const userCredits = await prisma.subscription.findMany({
      where: {
        userId: {
          in: visits.map(visit => visit.userId),
        },
        OR: [
          {
            status: "active",
          },
          {
            status: "trialing",
          },
        ],
      },
    });

    // Group visits by userId
    const groupedVisits = visits.reduce(
      (acc, visit) => {
        if (!acc[visit.userId]) {
          const user = userCredits.find(user => user.userId === visit.userId);
          acc[visit.userId] = {
            userId: visit.userId,
            name: visit.name,
            visits: [],
            creditsPerPeriod: user?.creditsPerPeriod || 0,
            creditsRemaining: user?.creditsRemaining || 0,
          };
        }
        acc[visit.userId].visits.push(visit);
        return acc;
      },
      {} as Record<
        string,
        {
          userId: string;
          name: string;
          visits: typeof visits;
          creditsPerPeriod: number;
          creditsRemaining: number;
        }
      >,
    );

    // Convert to array and sort by last visit date
    const result = Object.values(groupedVisits)
      .map(group => ({
        userId: group.userId,
        name: group.name,
        lastVisit: group.visits[0].createdAt,
        totalVisits: group.visits.length,
        creditsPerPeriod: group.creditsPerPeriod,
        creditsRemaining: group.creditsRemaining,
      }))
      .sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { error: "Failed to fetch visits" },
      { status: 500 },
    );
  }
}
