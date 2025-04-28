import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_db/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { FeatureFlag } from "@prisma/client";

// GET: Fetch all users with their feature flags
export async function GET() {
//   const session = await getServerSession(authOptions);

//   if (!session?.user.meta?.isAdmin) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

  try {
    // Fetch users with their metadata (including feature flags)
    const usersFromDb = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userMetadata: {
          select: {
            id: true,
            featureFlags: true,
            isAdmin: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const users = usersFromDb.map(user => ({
      ...user,
      userMetadata: user.userMetadata[0],
    }));

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: {
          in: users.map(user => user.id),
        },
      },
    });

    const payments = await prisma.payment.findMany({
      where: {
        userId: {
          in: users.map(user => user.id),
        },
      },
    });

    const visits = await prisma.visits.findMany({
      where: {
        userId: {
          in: users.map(user => user.id),
        },
      },
    });

    const usersWithPlans = users.map(user => {
      const userPlan = subscriptions.find(
        subscription => subscription.userId === user.id,
      );
      const userVisits = visits.filter(visit => visit.userId === user.id);
      const latestVisit = userVisits.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })[0];
      const isFree = !payments.some(payment => payment.userId === user.id);
      return {
        ...user,
        plan: userPlan?.plan,
        latestVisit: latestVisit?.createdAt,
        planEndsAt: userPlan?.currentPeriodEnd,
        isFree,
      };
    });

    return NextResponse.json(usersWithPlans);
  } catch (error) {
    console.error("Error fetching users with feature flags:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// PATCH: Update feature flags for a user
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.meta?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, featureFlag, enabled, adminData } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const userData = await prisma.userMetadata.findFirst({
      where: { userId },
    });

    if (!userData) {
      return NextResponse.json(
        { error: "User metadata not found" },
        { status: 404 },
      );
    }

    let updatedFeatureFlags = [...(userData.featureFlags || [])];
    let isAdmin = adminData?.enabled;
    if (featureFlag) {
      // check if the featureFlag is part of the FeatureFlag enum
      if (!Object.values(FeatureFlag).includes(featureFlag)) {
        return NextResponse.json(
          { error: "Invalid feature flag" },
          { status: 400 },
        );
      }

      if (enabled && !updatedFeatureFlags.includes(featureFlag)) {
        // Add the feature flag
        updatedFeatureFlags.push(featureFlag);
      } else if (!enabled && updatedFeatureFlags.includes(featureFlag)) {
        // Remove the feature flag
        updatedFeatureFlags = updatedFeatureFlags.filter(
          flag => flag !== featureFlag,
        );
      }
    }
    // Update the user's feature flags
    const updatedUser = await prisma.userMetadata.update({
      where: { userId },
      data: { featureFlags: updatedFeatureFlags, isAdmin },
      select: {
        userId: true,
        featureFlags: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating feature flags:", error);
    return NextResponse.json(
      { error: "Failed to update feature flags" },
      { status: 500 },
    );
  }
}
