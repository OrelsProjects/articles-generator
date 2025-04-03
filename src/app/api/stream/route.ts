import { NextRequest, NextResponse } from "next/server";
import { runPrompt, runPromptStream } from "@/lib/open-router";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.meta?.isAdmin ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { prompt } = await req.json();

    // Create a TransformStream to handle the streaming response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Start the streaming process
    (async () => {
      try {
        const response = runPromptStream(
          [{ role: "user", content: prompt }],
          "openai/gpt-4o-mini",
        );

        // Write the response to the stream
        for await (const chunk of response) {
          console.log("Chunk:", chunk);
          await writer.write(encoder.encode(chunk));
        }
        await writer.close();
      } catch (error) {
        console.error("Error in streaming:", error);
        await writer.abort(error);
      }
    })();

    // Return the streamed response
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in streaming route:", error);
    return new Response("Something went wrong", { status: 500 });
  }
}
