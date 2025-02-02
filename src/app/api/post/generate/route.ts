import { runPrompt } from "@/lib/openRouter";
import { getMessages } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const response = await fetch("http://localhost:3002/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Ensure JSON is properly recognized
    },
    body: JSON.stringify({ prompt }),
  });
  const data = (await response.json()) as { url: string; content: string }[];
  const { messages, model } = getMessages(
    "generate",
    data.map((d) => d.content)
  );
  const article = await runPrompt(messages, model);
  return NextResponse.json(article);
}
