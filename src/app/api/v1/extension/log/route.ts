import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";

interface LogPayload {
  message: string;
  data?: string;
  timestamp: string;
  source: string;
  level: "info" | "error" | "warn";
}

export async function PATCH(request: NextRequest) {
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
    const dataString = data
      ? JSON.stringify({
          message,
          data,
          headers,
        })
      : "";
    const payloadLog = {
      message,
      data: data ? JSON.stringify(data) : "",
      headers,
      userId: session?.user.id || "extension",
    };

    if (level === "error") {
      loggerServer.error(`${logPrefix} ERROR: ${dataString}`, payloadLog);
    } else if (level === "warn") {
      loggerServer.warn(`${logPrefix} WARN: ${dataString}`, payloadLog);
    } else {
      loggerServer.info(`${logPrefix}: ${dataString}`, payloadLog);
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
