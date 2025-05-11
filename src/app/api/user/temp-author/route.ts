import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  return NextResponse.json(session?.user.meta?.tempAuthorId, { status: 200 });
}
