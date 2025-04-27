import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";

interface LogPayload {
  message: string;
  data?: string;
  timestamp: string;
  source: string;
  level: "info" | "error";
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the request body
    const payload: LogPayload = await request.json();

    // Extract the log information
    const { message, data, timestamp, source, level } = payload;

    // Format log message with timestamp and user info
    const logPrefix = `[${timestamp}] [${source}] [${session.user.name || session.user.email}]`;

    // Log to console based on the message content
    if (level === "error") {
      if (data) {
        console.error(`${logPrefix} ERROR:`, message, JSON.parse(data));
      } else {
        console.error(`${logPrefix} ERROR:`, message);
      }
    } else {
      if (data) {
        console.log(`${logPrefix}:`, message, JSON.parse(data));
      } else {
        console.log(`${logPrefix}:`, message);
      }
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing extension log:", error);
    return NextResponse.json(
      { error: "Failed to process log" },
      { status: 500 },
    );
  }
}
