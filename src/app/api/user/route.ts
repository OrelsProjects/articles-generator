import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/auth/authOptions";
import AppUser from "@/types/appUser";
import prisma from "@/app/api/_db/db";
import Logger from "@/loggerServer";

export async function GET(req: NextRequest): Promise<any> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest): Promise<any> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let user: AppUser | null = null;
  try {
    const { user: sessionUser } = session;
    const body = await req.json();
    user = body as AppUser;
    user.email = sessionUser?.email || user.email;
    user.image = sessionUser?.image || user.image;
  } catch (error: any) {
    Logger.error("Error initializing logger", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<any> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    if (!session.user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    await prisma.user.delete({
      where: { id: session.user?.id },
    });
    return NextResponse.json({}, { status: 200 });
  } catch (error: any) {
    Logger.error("Error deleting user", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
