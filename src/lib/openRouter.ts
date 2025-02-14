import axios from "axios";
import { get_encoding, encoding_for_model, TiktokenModel } from "tiktoken";

// const models = ["anthropic/claude-3.5-sonnet", "openai/gpt-4o-mini"];
export type Model =
  | "openai/gpt-4o"
  | "openai/gpt-4o-mini"
  | "anthropic/claude-3.5-sonnet"
  | "google/gemini-2.0-flash-001";

function getTokenCount(text: string, model: TiktokenModel) {
  const encoding = encoding_for_model(model);
  const tokens = encoding.encode(text);
  return tokens.length;
}

export async function runPrompt(
  messages: { role: string; content: string }[],
  model: Model,
): Promise<string> {
  let tokenCount = 0;
  let tiktokenModel: TiktokenModel = "gpt-4o";
  if (model.includes("openai")) {
    tiktokenModel = model.replace("openai/", "") as TiktokenModel;
    tokenCount = getTokenCount(
      messages.map(m => m.content).join("\n"),
      tiktokenModel,
    );
  }
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
