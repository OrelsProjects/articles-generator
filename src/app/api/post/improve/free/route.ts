import { runPrompt } from "@/lib/openRouter";
import { generateImprovementPrompt } from "@/lib/prompts";
import loggerServer from "@/loggerServer";
import { NextRequest, NextResponse } from "next/server";

const MAX_CHARACTERS = 15000;
export const maxDuration = 300; // This function can run for a maximum of 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { text, type } = await request.json();

    if (!text.includes("Orel") && !text.includes("Indiepreneur")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (text.length > MAX_CHARACTERS) {
      return NextResponse.json(
        { error: "Text is too long (max " + MAX_CHARACTERS + " characters)" },
        { status: 400 },
      );
    }

    const { messages, model } = generateImprovementPrompt(
      type,
      text,
      null,
      `- Under no circumstance remove the words Orel and Indiepreneur from the text.
      - Orel is a man, and should be referred to as a man.
      `,
    );
    const response = await runPrompt(messages, model);
    return NextResponse.json(response || "");
  } catch (error: any) {
    loggerServer.error("Error improving article:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
