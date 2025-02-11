import prisma from "@/app/api/_db/db";
import { NextRequest, NextResponse } from "next/server";
import cuid from "cuid";
import { Plan } from "@prisma/client";

const ONE_DAY = 1000 * 60 * 60 * 24; // 1 day
const EXPIRATION_TIME = ONE_DAY * 5; // 5 days

const getNewExpiresAt = () => new Date(Date.now() + EXPIRATION_TIME);

export async function GET(req: NextRequest) {
  try {
    const freeUsers = await prisma.freeUsers.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(freeUsers);
  } catch (error) {
    console.error("Error fetching free users:", error);
    return NextResponse.json(
      { error: "Failed to fetch free users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const code = cuid();
    const hostname = req.headers.get("host");
    const url = `https://${hostname}/login?code=${code}`;
    const freeUser = await prisma.freeUsers.create({
      data: {
        code,
        plan: "superPro" as Plan,
        codeExpiresAt: getNewExpiresAt(),
        url,
      },
    });

    return NextResponse.json({
      freeUser,
    });
  } catch (error) {
    console.error("Error creating free user:", error);
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
  } catch (error) {
    console.error("Error updating free user:", error);
    return NextResponse.json(
      { error: "Failed to update free user" },
      { status: 500 },
    );
  }
}
