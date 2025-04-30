import { prisma } from "@/app/api/_db/db";

export async function getUserLatestPayment(userId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return payment;
}
