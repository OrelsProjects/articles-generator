import axios from "axios";
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

// const models = ["anthropic/claude-3.7-sonnet", "openai/gpt-4o-mini"];
export type Model =
  | "openai/gpt-4o"
  | "openai/gpt-4o-mini"
  | "anthropic/claude-3.7-sonnet"
  | "anthropic/claude-3.5-sonnet"
  | "google/gemini-2.0-flash-001";

function getTokenCount(text: string) {
  const encoding = new Tiktoken(o200k_base);
  const tokens = encoding.encode(text);
  return tokens.length;
}

export async function runPrompt(
  messages: { role: string; content: string }[],
  model: Model,
): Promise<string> {
  let tokenCount = 0;
  tokenCount = getTokenCount(messages.map(m => m.content).join("\n"));
  console.log(
    "About to run prompt on model",
    model,
    "Estimated token count:",
    tokenCount,
  );
  console.time("runPrompt");
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: model,
      messages,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );
  console.timeEnd("runPrompt");

  let llmResponse = response.data.choices[0].message.content;

  if (!model.includes("anthropic")) {
    llmResponse = llmResponse.replace(/```json|```/g, "").trim();
  }
  return llmResponse;
}
