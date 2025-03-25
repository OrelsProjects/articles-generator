import prisma from "@/app/api/_db/db";
import { featureFlagsPerPlan } from "@/lib/plans-consts";
import { Plan } from "@prisma/client";

export async function setFeatureFlagsByPlan(plan: Plan, userId: string) {
  const featureFlags = featureFlagsPerPlan[plan];
  await prisma.userMetadata.update({
    where: {
      userId,
    },
    data: {
      featureFlags,
    },
  });
}
