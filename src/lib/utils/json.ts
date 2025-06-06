import { runPrompt } from "@/lib/open-router";
import { jsonrepair } from "jsonrepair";

import { Model } from "@/lib/open-router";
import { fixJsonPrompt } from "@/lib/prompts";
import loggerServer from "@/loggerServer";

export function fixJsonRepair<T>(json: string): T | null {
  try {
    const jsonFixed = jsonrepair(json);
    const jsonFixedObject = JSON.parse(jsonFixed) as T;
    return jsonFixedObject;
  } catch (error: any) {
    loggerServer.warn("Error fixing JSON:", {
      error,
      userId: "json",
    });
    return null;
  }
}

function fixJson<T>(json: string): T | null {
  const jsonRepairFixed = fixJsonRepair<T>(json);
  if (jsonRepairFixed) {
    return jsonRepairFixed;
  }
  // Find first index of { and last index of }
  const start = json.indexOf("{");
  const end = json.lastIndexOf("}");
  const jsonFixed = json.substring(start, end + 1);
  try {
    return JSON.parse(jsonFixed);
  } catch (error: any) {
    loggerServer.warn("Error fixing JSON:", {
      error,
      userId: "json",
    });
    return null;
  }
}

export async function parseJson<T>(
  json: string,
  model: Model = "openai/gpt-4o",
): Promise<T> {
  let parsedJson: T;
  try {
    parsedJson = JSON.parse(json);
  } catch (error: any) {
    loggerServer.warn("Error parsing JSON:\n" + json, {
      error,
      userId: "json",
    });
    const jsonFixedSync = fixJson<T>(json);
    if (!jsonFixedSync) {
      const jsonFixedString = await runPrompt(
        fixJsonPrompt(json),
        model,
        "JSON-FIX-" + "system",
      );
      let jsonFixed = jsonFixedString.replace("```json", "").replace("```", "");
      const jsonFixedObject = fixJson<{ json: T }>(jsonFixed);
      if (!jsonFixedObject) {
        loggerServer.warn("Failed to fix JSON:", {
          jsonFixed,
          userId: "json",
        });
        throw new Error("Failed to fix JSON");
      }
      const attemptParseJson = jsonFixedObject.json;
      // If attemptParsejson is an object, put it in parsedJson, otherwise parse it and then put it in parsedJson
      if (typeof attemptParseJson === "object") {
        parsedJson = attemptParseJson;
      } else {
        parsedJson = JSON.parse(`${attemptParseJson}`);
      }
    } else {
      parsedJson = jsonFixedSync;
    }
  }
  return parsedJson;
}
