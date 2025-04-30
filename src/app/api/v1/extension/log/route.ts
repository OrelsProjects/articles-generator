import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";

interface LogPayload {
  message: string;
  data?: string;
  timestamp: string;
  source: string;
  level: "info" | "error";
}

export async function POST(request: NextRequest) {
  // Verify authentication
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Error processing extension log:", error);
    return NextResponse.json(
      { error: "Failed to process log" },
      { status: 500 },
    );
  }
  try {
    const headers = request.headers;
    // Parse the request body
    const payload: LogPayload = await request.json();

    // Extract the log information
    const { message, data, timestamp, source, level } = payload;

    // Format log message with timestamp and user info
    const logPrefix = `[${timestamp}] [${source}] [${session?.user.name || session?.user.email || "unknown"}]`;

    // Log to console based on the message content
    if (level === "error") {
      if (data) {
        loggerServer.error(`${logPrefix} ERROR:`, {
          message,
          data,
          headers,
        });
      } else {
        loggerServer.error(`${logPrefix} ERROR:`, { message, headers });
      }
    } else {
      if (data) {
        loggerServer.info(`${logPrefix}:`, { message, data, headers });
      } else {
        loggerServer.info(`${logPrefix}:`, { message, headers });
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
