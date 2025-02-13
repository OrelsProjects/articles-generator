import axios from "axios";

// const models = ["anthropic/claude-3.5-sonnet", "openai/gpt-4o-mini"];
export type Model =
  | "openai/gpt-4o"
  | "openai/gpt-4o-mini"
  | "anthropic/claude-3.5-sonnet"
  | "google/gemini-flash-1.5-8b";

export async function runPrompt(
  messages: { role: string; content: string }[],
  model: Model,
): Promise<string> {
  console.log("About to run prompt on model", model);
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
