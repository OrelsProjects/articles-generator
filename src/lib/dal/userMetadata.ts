import { prisma } from "@/lib/prisma";
import { featureFlagsPerPlan } from "@/lib/plans-consts";
import loggerServer from "@/loggerServer";
import { Plan } from "@prisma/client";

export async function setFeatureFlagsByPlan(plan: Plan, userId: string) {
  const featureFlags = featureFlagsPerPlan[plan];
  try {
  await prisma.userMetadata.update({
    where: {
      userId,
    },
    data: {
      featureFlags,
    },
    });
  } catch (error) {
    loggerServer.error("Error setting feature flags by plan", {
      error,
      userId,
    });
  }
}
