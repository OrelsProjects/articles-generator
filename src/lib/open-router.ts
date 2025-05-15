import loggerServer from "@/loggerServer";
import { Model429Error } from "@/types/errors/Model429Error";
import axiosInstance from "@/lib/axios-instance";
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";
import { createParser, EventSourceMessage } from "eventsource-parser";

// const models = ["anthropic/claude-3.5-sonnet", "openai/gpt-4o-mini"];
export type Model =
  | "openai/gpt-4o"
  | "openai/gpt-4o-mini"
  | "anthropic/claude-3.7-sonnet"
  | "anthropic/claude-3.5-sonnet"
  | "anthropic/claude-3.5-haiku"
  | "google/gemini-2.0-flash-001"
  | "openai/gpt-4.5-preview"
  | "x-ai/grok-3-beta"
  | "google/gemini-2.5-pro-preview-03-25"
  | "openrouter/auto"
  | "openai/gpt-4.1"
  | "deepseek/deepseek-r1";

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
    "google/gemini-2.5-pro-preview-03-25": 1.25,
    "openai/gpt-4.1": 2,
    "x-ai/grok-3-beta": 3,
    "openrouter/auto": 2,
    "deepseek/deepseek-r1": 0.54,
  };
  const pricePerMillionTokensOutput = {
    "openai/gpt-4o": 10,
    "openai/gpt-4o-mini": 0.6,
    "anthropic/claude-3.7-sonnet": 15,
    "anthropic/claude-3.5-sonnet": 15,
    "google/gemini-2.0-flash-001": 0.6,
    "openai/gpt-4.5-preview": 150,
    "anthropic/claude-3.5-haiku": 4,
    "google/gemini-2.5-pro-preview-03-25": 10,
    "openai/gpt-4.1": 8,
    "x-ai/grok-3-beta": 15,
    "openrouter/auto": 2,
    "deepseek/deepseek-r1": 2.18,
  };
  let price = (tokens / 1000000) * pricePerMillionTokensInput[model];
  if (outputTokens) {
    price += (outputTokens / 1000000) * pricePerMillionTokensOutput[model];
  }
  return price;
}

export async function runPrompt(
  messages: { role: string; content: string }[],
  model: Model = "openrouter/auto",
  sourceName: string,
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
  let response = await axiosInstance.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.writestack.io",
        "X-Title": `WriteStack-${sourceName}`,
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
      response = await axiosInstance.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: model,
          messages,
        },
      );
      if (error.code === "429") {
        throw new Model429Error(
          `The model ${model} is currently overloaded. Please try again later.`,
        );
      }
    }
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

/**
 * Like runPrompt but returns chunks as they arrive from OpenRouter in stream mode.
 *
 * Usage example:
 *
 *   for await (const chunk of runPromptStream([...], 'anthropic/claude-3.5-sonnet')) {
 *     // chunk is a string of newly received text
 *   }
 */
export async function* runPromptStream(
  messages: { role: string; content: string }[],
  model: Model,
): AsyncGenerator<string, string, unknown> {
  // 1) Precompute input token costs (same as before)
  const inputText = messages.map(m => m.content).join("\n");
  let tokenCount = getTokenCount(inputText);
  const priceInput = getPrice(model, tokenCount);
  console.log(
    "About to run prompt on model",
    model,
    "Estimated token count:",
    tokenCount,
    "Estimated price:",
    `$${priceInput.toFixed(5)}`,
  );
  console.time("runPromptStream");

  // 2) Fire off a streaming POST
  const response = await axiosInstance.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages,
      stream: true,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      responseType: "stream", // tell axios to give us a Node.js readable stream
    },
  );

  console.timeEnd("runPromptStream");

  // Handle top-level error if present (rare with streaming, but let's be safe)
  if (response.data.error) {
    loggerServer.error(
      `Error running prompt ${model}: ${JSON.stringify(response.data)}`,
    );
    if (model.includes("openai") && response.data.error.code === "429") {
      throw new Model429Error(
        `The model ${model} is currently overloaded. Please try again later.`,
      );
    }
    throw new Error(
      `Something went wrong with running the prompts. ${JSON.stringify(response.data)}`,
    );
  }

  // 3) Setup our parser
  const stream = response.data; // Node.js Readable from axios
  const decoder = new TextDecoder();

  let fullResponse = ""; // accumulate final text
  const chunkBuffer: string[] = []; // buffer for new partial tokens

  const parser = createParser({
    onEvent: (event: EventSourceMessage) => {
      if (event.data === "[DONE]") {
        // indicates the end of stream
        return;
      }
      try {
        // Typically each chunk is JSON like: { "choices": [ { "delta": { "content": "some text" } } ] }
        const json = JSON.parse(event.data);
        const tokenChunk = json?.choices?.[0]?.delta?.content || "";
        if (tokenChunk) {
          fullResponse += tokenChunk;
          // Add it to our buffer so we can yield it in the main loop
          chunkBuffer.push(tokenChunk);
        }
      } catch (err) {
        console.warn("Could not parse stream chunk as JSON:", event.data, err);
      }
    },
  });

  // 4) Read chunks from the stream in a loop
  for await (const chunk of stream) {
    // feed each chunk to the parser
    parser.feed(decoder.decode(chunk));

    // now yield any newly parsed tokens in chunkBuffer
    while (chunkBuffer.length > 0) {
      const nextChunk = chunkBuffer.shift()!;
      yield nextChunk;
    }
  }

  // 5) The stream is done. If you want to strip out markdown fences for non-anthropic, do it here:
  let finalText = fullResponse;
  if (!model.includes("anthropic")) {
    finalText = finalText.replace(/```json|```/g, "").trim();
  }

  // do final token/cost calculations
  const outputTokens = getTokenCount(finalText);
  const priceOutput = getPrice(model, 0, outputTokens);
  console.log("Output tokens:", outputTokens);
  console.log("Actual price:", `$${(priceInput + priceOutput).toFixed(4)}`);

  // optionally yield the entire text as the final yield
  // yield finalText;

  // return value (if you do `await iterator.next()`) will be the final text
  return finalText;
}
