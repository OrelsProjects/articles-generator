import prisma from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all visits with user information
    const visits = await prisma.visits.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group visits by userId
    const groupedVisits = visits.reduce((acc, visit) => {
      if (!acc[visit.userId]) {
        acc[visit.userId] = {
          userId: visit.userId,
          name: visit.name,
          visits: [],
        };
      }
      acc[visit.userId].visits.push(visit);
      return acc;
    }, {} as Record<string, { userId: string; name: string; visits: typeof visits }>);

    // Convert to array and sort by last visit date
    const result = Object.values(groupedVisits).map(group => ({
      userId: group.userId,
      name: group.name,
      lastVisit: group.visits[0].createdAt,
      totalVisits: group.visits.length,
    })).sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { error: "Failed to fetch visits" },
      { status: 500 },
    );
  }
} 