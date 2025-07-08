import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/auth/authOptions";
import { GhostwriterDAL } from "@/lib/dal/ghostwriter";
import loggerServer from "@/loggerServer";
import { GhostwriterClient } from "@/types/ghost-writer";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clients = await GhostwriterDAL.getClients(session.user.id);
    return NextResponse.json(clients);
  } catch (error) {
    loggerServer.error("Error getting ghostwriter clients", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { accessId } = await request.json();

    if (!accessId) {
      return NextResponse.json(
        { error: "Access ID required" },
        { status: 400 },
      );
    }

    const client: GhostwriterClient | null =
      await GhostwriterDAL.stopGhostwriting(session.user.id, accessId);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Ghostwriter profile not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "Access not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    loggerServer.error("Error stopping ghostwriting", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
