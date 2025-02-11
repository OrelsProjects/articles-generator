import { runPrompt } from "@/lib/openRouter";

import { Model } from "@/lib/openRouter";
import { fixJsonPrompt } from "@/lib/prompts";

function fixJson(json: string) {
  // Find first index of { and last index of }
  const start = json.indexOf("{");
  const end = json.lastIndexOf("}");
  const jsonFixed = json.substring(start, end + 1);
  try {
    return JSON.parse(jsonFixed);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function parseJson<T>(
  json: string,
  model: Model = "openai/gpt-4o-mini",
): Promise<T> {
  let parsedJson: T;
  try {
    parsedJson = JSON.parse(json);
  } catch (error) {
    console.error(error);
    const jsonFixedSync = fixJson(json);
    if (!jsonFixedSync) {
      const jsonFixed = await runPrompt(fixJsonPrompt(json), model);
      parsedJson = JSON.parse(jsonFixed).json;
    } else {
      parsedJson = jsonFixedSync;
    }
  }
  return parsedJson;
}