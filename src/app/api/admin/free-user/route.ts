import prisma from "@/app/api/_db/db";
import { NextRequest, NextResponse } from "next/server";
import cuid from "cuid";
import loggerServer from "@/loggerServer";
import { authOptions } from "@/auth/authOptions";
import { getServerSession } from "next-auth";

const ONE_DAY = 1000 * 60 * 60 * 24; // 1 day
const EXPIRATION_TIME = ONE_DAY * 5; // 5 days

const getNewExpiresAt = () => new Date(Date.now() + EXPIRATION_TIME);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.meta?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const freeUsers = await prisma.freeUsers.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(freeUsers);
  } catch (error: any) {
    loggerServer.error("Error fetching free users:", error);
    return NextResponse.json(
      { error: "Failed to fetch free users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.meta?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { name } = await req.json();
    const code = cuid();
    const hostname = req.headers.get("host");
    const url = `https://${hostname}/login?code=${code}`;
    const freeUser = await prisma.freeUsers.create({
      data: {
        code,
        plan: "premium",
        codeExpiresAt: getNewExpiresAt(),
        url,
        name,
      },
    });

    return NextResponse.json({
      freeUser,
    });
  } catch (error: any) {
    loggerServer.error("Error creating free user:", error);
    return NextResponse.json(
      { error: "Failed to create free user" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, refreshExpiresAt } = await req.json();
    const freeUser = await prisma.freeUsers.findFirst({
      where: { id },
    });

    if (!freeUser) {
      return NextResponse.json(
        { error: "Free user not found" },
        { status: 404 },
      );
    }

    const newExpiresAt = refreshExpiresAt
      ? getNewExpiresAt()
      : freeUser.codeExpiresAt;

    const updatedUser = await prisma.freeUsers.update({
      where: { id },
      data: {
        status,
        codeExpiresAt: newExpiresAt,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    loggerServer.error("Error updating free user:", error);
    return NextResponse.json(
      { error: "Failed to update free user" },
      { status: 500 },
    );
  }
}
