import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import Ably, { capabilityOp } from "ably";
import loggerServer from "@/loggerServer";
import { GhostwriterDAL } from "@/lib/dal/ghostwriter";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const ablyApiKey = process.env.ABLY_API_KEY;
    if (!ablyApiKey) {
      return NextResponse.json(
        { error: "Ably API key not configured" },
        { status: 500 },
      );
    }

    // Initialize Ably with API key
    const ably = new Ably.Rest(ablyApiKey);

    const clients = await GhostwriterDAL.getClients(session.user.id);
    const ghostwriters = await GhostwriterDAL.getAccessList(session.user.id);

    // No need if there are no ghostwriters.
    const allowSelfSubscribe = ghostwriters.length > 0;
    const capabilities: { [key: string]: capabilityOp[] | ["*"] } =
      Object.fromEntries(
        clients.map(client => [
          `client:${client.accountUserId}`,
          ["subscribe", "publish"],
        ]),
      );

    // if (allowSelfSubscribe) {
      capabilities[`client:${session.user.id}`] = ["subscribe", "publish"];
    // }

    const tokenRequest = await ably.auth.requestToken({
      clientId: session.user.id,
      capability: capabilities,
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    loggerServer.error("Error creating Ably token", {
      error: JSON.stringify(error),
      userId: session?.user?.id,
      session: JSON.stringify(session),
    });
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 },
    );
  }
}
