import { featureFlagsPerPlan } from "@/lib/plans-consts";
import { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";

export async function updateUserFeatureFlags(userId: string, plan: Plan) {
  const newFeatureFlags = featureFlagsPerPlan[plan];

  try {
  await prisma.userMetadata.update({
    where: { userId },
    data: { featureFlags: newFeatureFlags },
    });
  } catch (error: any) {
    loggerServer.critical("Error updating user feature flags", {
      error,
      userId,
      plan,
    });
  }
}
