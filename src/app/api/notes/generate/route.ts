import { prisma, prismaArticles } from "@/lib/prisma";
import { authOptions } from "@/auth/authOptions";
import { Filter, searchSimilarNotes } from "@/lib/dal/milvus";
import {
  generateNotesPrompt_v1,
  generateNotesPrompt_v2,
  generateNotesWritingStylePrompt_v1,
  generateNotesWritingStylePrompt_v2,
} from "@/lib/prompts";
import loggerServer from "@/loggerServer";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Post } from "@/../prisma/generated/articles";
import { Model, runPrompt } from "@/lib/open-router";
import { parseJson } from "@/lib/utils/json";
import { FeatureFlag, Note, NoteStatus } from "@prisma/client";
import { NoteDraft } from "@/types/note";
import { canUseAI, undoUseCredits, useCredits } from "@/lib/utils/credits";
import { AIUsageResponse } from "@/types/aiUsageResponse";
import { getByline } from "@/lib/dal/byline";
import { Model429Error } from "@/types/errors/Model429Error";
import { z } from "zod";
import { getPublicationByIds } from "@/lib/dal/publication";
import { formatNote } from "@/lib/utils/notes";
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
