import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { NoteDraft } from "@/types/note";
import { AIUsageResponse } from "@/types/aiUsageResponse";
import { z } from "zod";
import { generateNotes } from "@/lib/utils/generate/notes";

const generateNotesSchema = z.object({
  count: z.number().or(z.string()).optional(),
  model: z.string().optional(),
  useTopTypes: z.boolean().optional(),
  topic: z.string().optional(),
  preSelectedPostIds: z.array(z.string()).optional(),
});

export const maxDuration = 300; // This function can run for a maximum of 5 minutes

const modelsRequireImprovement = [
  "anthropic/claude-3.5-haiku",
  "openai/gpt-4.1",
  "x-ai/grok-3-beta",
];

export async function POST(
  req: NextRequest,
): Promise<NextResponse<AIUsageResponse<NoteDraft[]>>> {
  console.time("generate notes");
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await req.json();

  const parsedBody = generateNotesSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const notesCount = parsedBody.data.count
    ? parseInt(parsedBody.data.count.toString())
    : undefined;
  const requestedModel = parsedBody.data.model;
  const useTopTypes = !!parsedBody.data.useTopTypes;
  const topic = parsedBody.data.topic;
  const preSelectedPostIds = parsedBody.data.preSelectedPostIds;
  const featureFlags = session.user.meta?.featureFlags || [];

  loggerServer.time("generate notes");
  const response = await generateNotes({
    notesCount,
    requestedModel,
    useTopTypes,
    topic,
    preSelectedPostIds,
  });

  loggerServer.timeEnd("generate notes");
  if (!response.success) {
    return NextResponse.json(
      { success: false, error: response.errorMessage },
      { status: response.status },
    );
  }

  return NextResponse.json(response.data!, { status: response.status });
}
