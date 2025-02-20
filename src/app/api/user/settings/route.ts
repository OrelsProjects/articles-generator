import { getServerSession } from "next-auth";
import { getUsages } from "@/lib/dal/usage";
import { NextResponse } from "next/server";
import loggerServer from "@/loggerServer";
import { authOptions } from "@/auth/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usages = await getUsages(
      session?.user?.id,
      session?.user?.meta?.plan || "free",
    );

    return NextResponse.json({ usages });
  } catch (error) {
    loggerServer.error("Error getting usages", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
