import { prisma, prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { PotentialClientStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user.meta?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const postsWithStatus = await prisma.potentialClients.findMany({
      where: {
        status: {
          not: PotentialClientStatus.deleted,
        },
      },
    });
    return NextResponse.json(postsWithStatus);
  } catch (error: any) {
    loggerServer.error("Error in potential-users route:", {
      error,
      userId: session?.user.id,
    });
    return NextResponse.json(
      { error: "Failed to fetch potential users" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const { canonicalUrl, status } = await req.json();
  await prisma.potentialClients.update({
    where: { canonicalUrl },
    data: { status },
  });

  return NextResponse.json({ message: "Potential client updated" });
}
