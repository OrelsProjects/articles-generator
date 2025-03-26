import loggerServer from "@/loggerServer";
import axios from "axios";
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

// const models = ["anthropic/claude-3.5-sonnet", "openai/gpt-4o-mini"];
export type Model =
  | "openai/gpt-4o"
  | "openai/gpt-4o-mini"
  | "anthropic/claude-3.7-sonnet"
  | "anthropic/claude-3.5-sonnet"
  | "anthropic/claude-3.5-haiku"
  | "google/gemini-2.0-flash-001"
  | "openai/gpt-4.5-preview"
  | "google/gemini-2.5-pro-exp-03-25:free";

export function getTokenCount(text: string) {
  const encoding = new Tiktoken(o200k_base);
  const tokens = encoding.encode(text);
  return tokens.length;
}

function getPrice(model: Model, tokens: number, outputTokens?: number) {
  const pricePerMillionTokensInput = {
    "openai/gpt-4o": 2.5,
    "openai/gpt-4o-mini": 0.15,
    "anthropic/claude-3.7-sonnet": 3,
    "anthropic/claude-3.5-sonnet": 3,
    "google/gemini-2.0-flash-001": 0.15,
    "openai/gpt-4.5-preview": 75,
    "anthropic/claude-3.5-haiku": 0.8,
    "google/gemini-2.5-pro-exp-03-25:free": 0,
  };
  const pricePerMillionTokensOutput = {
    "openai/gpt-4o": 10,
    "openai/gpt-4o-mini": 0.6,
    "anthropic/claude-3.7-sonnet": 15,
    "anthropic/claude-3.5-sonnet": 15,
    "google/gemini-2.0-flash-001": 0.6,
    "openai/gpt-4.5-preview": 150,
    "anthropic/claude-3.5-haiku": 4,
    "google/gemini-2.5-pro-exp-03-25:free": 0,
  };
  let price = (tokens / 1000000) * pricePerMillionTokensInput[model];
  if (outputTokens) {
    price += (outputTokens / 1000000) * pricePerMillionTokensOutput[model];
  }
  return price;
}

export async function runPrompt(
  messages: { role: string; content: string }[],
  model: Model,
): Promise<string> {
  let tokenCount = 0;
  tokenCount = getTokenCount(messages.map(m => m.content).join("\n"));
  const priceInput = getPrice(model, tokenCount);
  console.log(
    "About to run prompt on model",
    model,
    "Estimated token count:",
    tokenCount,
    "Estimated price:",
    `$${priceInput.toFixed(5)}`,
  );
  console.time("runPrompt");
  let response = await axios.post(
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

  const error = response.data.error;
  if (error) {
    loggerServer.error(
      `Error running prompt ${model}: ${JSON.stringify(response.data)}`,
    );
    // try with another. If it was openai, try claude
    if (model.includes("openai")) {
      model = "anthropic/claude-3.5-sonnet";
      response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: model,
          messages,
        },
      );
    }
  }

  if (response.data.error) {
    throw new Error(
      `Something went wrong with running the prompts. ${JSON.stringify(response.data)}`,
    );
  }

  let llmResponse = response.data.choices[0].message.content;

  console.log("Prompt output token count:", getTokenCount(llmResponse));

  if (!model.includes("anthropic")) {
    llmResponse = llmResponse.replace(/```json|```/g, "").trim();
  }
  const outputTokens = getTokenCount(llmResponse);
  const priceOutput = getPrice(model, 0, outputTokens);
  console.log("Output tokens:", outputTokens);
  console.log("Actual price:", `$${(priceInput + priceOutput).toFixed(4)}`);
  return llmResponse;
}
