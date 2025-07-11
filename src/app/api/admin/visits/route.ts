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

    const userExtensionDetails = await prisma.extensionDetails.findMany({
      where: {
        userId: {
          in: visits.map(visit => visit.userId),
        },
      },
    });

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: visits.map(visit => visit.userId),
        },
      },
    });

    const usersPublications = await prisma.userMetadata.findMany({
      where: {
        userId: {
          in: visits.map(visit => visit.userId),
        },
      },
      include: {
        publication: true,
      },
    });

    // Group visits by userId
    const groupedVisits = visits.reduce(
      (acc, visit) => {
        if (!acc[visit.userId]) {
          const userCredit = userCredits.find(
            user => user.userId === visit.userId,
          );
          const user = users.find(user => user.id === visit.userId);
          const extensionDetails = userExtensionDetails.find(
            extension => extension.userId === visit.userId,
          );
          const userPublication = usersPublications.find(
            pub => (pub.userId = visit.userId),
          );
          acc[visit.userId] = {
            userId: visit.userId,
            name: visit.name || user?.email || "Unknown",
            visits: [],
            creditsPerPeriod: userCredit?.creditsPerPeriod || 0,
            creditsRemaining: userCredit?.creditsRemaining || 0,
            extensionVersion: extensionDetails?.versionInstalled || null,
            publicationUrl:
              userPublication?.publication?.publicationUrl || null,
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
          extensionVersion: string | null;
          publicationUrl: string | null;
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
        extensionVersion: group.extensionVersion,
        publicationUrl: group.publicationUrl,
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
