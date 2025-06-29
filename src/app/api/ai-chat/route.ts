import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { prisma, prismaArticles } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { runPrompt, runPromptStream } from "@/lib/open-router";
import { z } from "zod";
import { getAuthorId } from "@/lib/dal/publication";
import { getPreProcessorPrompt } from "@/lib/utils/chat/prompts";
import { parseJson } from "@/lib/utils/json";
import loggerServer from "@/loggerServer";
import { generateNotes } from "@/lib/utils/generate/notes";
import { generateIdeas } from "@/lib/utils/ideas";
import { getUserArticlesByUserId } from "@/lib/dal/articles";
import { getNotesPromptNoteMeta } from "@/lib/prompts";

export const maxDuration = 180; // This function can run for a maximum of 10 minutes

const createChatSchema = z.object({
  message: z.string().min(1).max(10000),
});

const sendMessageSchema = z.object({
  chatId: z.string(),
  message: z.string().min(1).max(10000),
});

// Pre-processor response schema
interface PreProcessorResponse {
  tool?: "generateNotes" | "generateArticleIdeas" | "unknown";
  needed?: "getNotes" | "getArticles" | "getArticlesWithBody";
  amount?: number;
  otherLLMPrompt?: string;
  nextStep: "ready" | "useTool";
  // Legacy fields for backward compatibility
  notesRequired?: boolean;
  articlesRequired?: boolean;
  notesBodyRequired?: boolean;
  articlesBodyRequired?: boolean;
  articlesVectorSearch?: boolean;
  articlesVectorSearchPhrase?: string;
  otherLLM?: boolean;
}

interface UserContext {
  writingStyle: string;
  topics: string;
  personality: string;
  recentNotes: { preview: string }[];
  generatedDescription: string;
  notesDescription: string;
  specialEvents: string;
}

// Helper function to get user context
async function getUserContext(
  userId: string,
  includeRecentNotes: boolean = false,
): Promise<UserContext> {
  const userMetadata = await prisma.userMetadata.findUnique({
    where: { userId },
    include: {
      publication: true,
    },
  });

  let recentNotes: { body: string }[] = [];

  // Only fetch recent notes if explicitly requested to avoid unnecessary data pulling
  if (includeRecentNotes) {
    const authorId = await getAuthorId(userId);
    if (authorId) {
      const userNotes = await prismaArticles.notesComments.findMany({
        where: {
          authorId,
        },
        take: 10,
        orderBy: { timestamp: "desc" },
        select: {
          body: true,
        },
      });
      recentNotes =
        userNotes?.map(note => ({
          body: note.body,
        })) || [];
    }
  }

  return {
    writingStyle:
      userMetadata?.noteWritingStyle ||
      userMetadata?.publication?.writingStyle ||
      "professional and clear",
    topics:
      userMetadata?.noteTopics ||
      userMetadata?.publication?.topics ||
      "general topics",
    notesDescription: userMetadata?.notesDescription || "",
    generatedDescription: userMetadata?.publication?.generatedDescription || "",
    specialEvents: userMetadata?.publication?.specialEvents || "",
    personality:
      userMetadata?.publication?.personality || "helpful and focused",
    recentNotes: includeRecentNotes
      ? recentNotes.map(note => ({
          preview: note.body,
        }))
      : [],
  };
}

// Helper function to call GPT-4-Nano pre-processor
async function callPreProcessor(
  userMessage: string,
  previousMessages: { role: string; content: string }[],
): Promise<PreProcessorResponse> {
  const preProcessorPrompt = getPreProcessorPrompt({
    userMessage,
  });

  try {
    // Use the OpenRouter API directly for a single response
    const response = await runPrompt(
      [
        {
          role: "system",
          content: preProcessorPrompt,
        },
        ...previousMessages,
      ],
      "openai/gpt-4o-mini",
      "ai-chat",
      {
        temperature: 0.1,
        max_tokens: 4000,
      },
    );

    // Parse JSON response
    try {
      const parsed = await parseJson<PreProcessorResponse>(response);
      return parsed;
    } catch (e) {
      loggerServer.error("Failed to parse pre-processor response:", {
        content: response,
        message: userMessage,
        preProcessorPrompt,
        userId: "ai-chat",
      });
      return { nextStep: "ready" };
    }
  } catch (error) {
    loggerServer.error("Pre-processor error:", {
      error,
      message: userMessage,
      preProcessorPrompt,
      userId: "ai-chat",
    });
    return { nextStep: "ready" };
  }
}

// Helper function to execute tools
async function executeTool(
  toolName: string,
  userId: string,
  amount: number = 10,
): Promise<string> {
  try {
    // Instead of making HTTP calls, directly execute the tool logic
    switch (toolName) {
      case "getUserNotes": {
        const limitedAmount = Math.min(Math.max(amount, 1), 50); // Ensure amount is between 1 and 50
        const notes = await prisma.note.findMany({
          where: {
            userId: userId,
            isArchived: false,
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            body: true,
            summary: true,
            topics: true,
            status: true,
            scheduledTo: true,
            createdAt: true,
            feedback: true,
          },
          take: limitedAmount,
        });

        return `Found ${notes.length} notes. Here are the ${limitedAmount === notes.length ? "all" : "most recent"} ones:\n\n${notes
          .map(
            (note: any) =>
              `- ${note.summary} (Topics: ${note.topics.join(", ")})\n  Status: ${note.status}, Created: ${new Date(note.createdAt).toLocaleDateString()}`,
          )
          .join("\n\n")}`;
      }

      case "getUserArticles": {
        const limitedAmount = Math.min(Math.max(amount, 1), 50); // Ensure amount is between 1 and 50
        const articles = await getUserArticlesByUserId(userId, {
          limit: limitedAmount,
          includeBody: false,
          order: {
            by: "postDate",
            direction: "desc",
          },
          select: ["title", "subtitle", "description", "postDate"],
        });

        return `Found ${articles.length} articles. Here are the ${limitedAmount === articles.length ? "all" : "most recent"} ones:\n\n${articles
          .map(
            (article: any) =>
              `- "${article.title}" - ${article.subtitle}\n  ${article.bodyText || article.description}`,
          )
          .join("\n\n")}`;
      }

      case "getArticlesWithBody": {
        const limitedAmount = Math.min(Math.max(amount, 1), 50); // Ensure amount is between 1 and 50
        const articles = await getUserArticlesByUserId(userId, {
          limit: limitedAmount * 2, // Fetch more to account for filtering
          includeBody: true,
          order: {
            by: "postDate",
            direction: "desc",
          },
          select: ["title", "postDate", "description", "bodyText"],
        });

        // Filter out articles without body content
        const articlesWithBody = articles
          .filter(article => article.bodyText && article.bodyText.length > 0)
          .slice(0, limitedAmount); // Limit to requested amount after filtering

        return `Found ${articlesWithBody.length} articles with body content. Here are the ${limitedAmount === articlesWithBody.length ? "all" : "most recent"} ones:\n\n${articlesWithBody
          .map(
            (article: any) =>
              `- "${article.title}" - ${article.subtitle}\n  ${article.description}\n  Body: ${article.bodyText}`,
          )
          .join("\n\n")}`;
      }

      case "generateNotes": {
        // Stream status first
        const result = await generateNotes({
          notesCount: 3,
          requestedModel: "auto",
          topic: "",
          preSelectedPostIds: [],
        });

        if (!result.success) {
          return `Error generating notes: ${result.errorMessage}`;
        }

        const notes = result.data?.responseBody?.body || [];
        return `## Generated Notes:\n\n${notes
          .map(
            (note: any, i: number) =>
              `\`\`\`note\n${note.body}\n\`\`\`\n\n**Topics:** ${note.topics?.join(", ") || "general"}\n**Summary:** ${note.summary || ""}`,
          )
          .join("\n\n---\n\n")}`;
      }

      case "generateArticleIdeas": {
        const userMetadata = await prisma.userMetadata.findUnique({
          where: { userId },
          include: { publication: true },
        });

        if (!userMetadata?.publication) {
          return "Error: Publication metadata not found. Please complete your profile setup first.";
        }

        const ideas = await generateIdeas(
          userId,
          "",
          userMetadata.publication,
          3,
          "false",
          [],
          {
            modelUsedForIdeas: "anthropic/claude-3.7-sonnet",
            modelUsedForOutline: "anthropic/claude-3.7-sonnet",
          },
          userMetadata,
        );

        return `## Generated Article Ideas:\n\n${ideas
          .map(
            (idea: any, i: number) =>
              `### Idea ${i + 1}: ${idea.title}\n**Subtitle:** ${idea.subtitle}\n**Description:** ${idea.description}\n\n**Outline:**\n${idea.outline}`,
          )
          .join("\n\n---\n\n")}`;
      }

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    console.error("Tool execution error:", error);
    return `Error executing tool ${toolName}: ${error}`;
  }
}

// Helper function to build system prompt
async function buildSystemPrompt(userContext: UserContext, userId: string) {
  const userNotes = await prisma.note.findMany({
    where: {
      userId,
      isArchived: false,
      OR: [{ status: "published" }, { status: "scheduled" }],
    },
    take: 15,
    orderBy: { updatedAt: "desc" },
  });

  const recentNotesSection =
    userContext.recentNotes?.length > 0
      ? `Recent Notes Preview:
${userContext.recentNotes.map((note: any) => `- ${note.preview}`).join("\n")}`
      : "";

  const { lenFloor, lenCeil, emojiRatio } = getNotesPromptNoteMeta(
    userNotes,
    280,
  );

  return `You are WriteStack MCP – a deeply integrated AI writing companion built into the user's editor. You operate with full access to the user's context, tone, and writing style. You are their second brain – focused, efficient, and never preachy.

You're not a generic chatbot. You're a high-IQ writing assistant that helps the user generate, improve, or rework content based on their past work.

User's Writing Context:
- Writing Style: ${userContext.writingStyle}
- Common Topics: ${userContext.topics}
- Personality: ${userContext.personality}
- About: ${userContext.generatedDescription}
- Special Events: ${userContext.specialEvents}

${recentNotesSection}

Your outputs must always:
- Match the user's writing style described above
- Be practical, sharp, and non-repetitive
- Use clear formatting (headings, bullet points, spacing)
- Stream responses smoothly

When generating notes:

1. wrap each note content with \`\`\`note markers:
\`\`\`note
Your note content here...
\`\`\`

2. Use the following length range:
- Minimum length: ${lenFloor} characters
- Maximum length: ${lenCeil} characters
3. YOU MUST USE MD format for the note content.
4. NO hashtags, colons in hooks, or em dashes.
5. If ${emojiRatio} ≤ 0.20, do not use emojis. Otherwise, match user ratio.
6. Use "\\n\\n" for **every** line break. Never output a single newline.
7. Twist every borrowed idea ≥ 40 % so it’s fresh.
8. **Never EVER copy and paste the same note from the user's previously written notes or inspiration notes.**

⚠️ IMPORTANT – HARD LIMIT  
Any note > ${lenCeil} chars (spaces *included*) is invalid.  
Regenerate it until it fits.



When generating articles, add the appropriate marker:
- For articles: Start with "[Generated Article]" or "## Article:"

You can help with:
1. Idea generation (e.g. "Give me 3 note ideas about burnout")
2. Style polishing (e.g. "Rewrite this to match my sarcastic tone")
3. Note-to-article expansion (e.g. "Take this note and build it into a full article outline")
4. Note review (e.g. "Critique this note in one paragraph")
5. Memory search (e.g. "What did I write about imposter syndrome last month?")
6. Similarity or insight clustering (e.g. "Cluster my notes into 3 core themes")

Do not invent new topics out of thin air unless explicitly asked.
If unsure, ask short clarifying questions to tailor the response.
You are not just helpful. You are deadly efficient.`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();

    // Check if it's a new chat or existing chat
    if (body?.chatId) {
      // Send message to existing chat
      const validatedData = sendMessageSchema.parse(body);

      // Verify chat ownership
      const chat = await prisma.aIChat.findUnique({
        where: {
          id: validatedData.chatId,
          userId: session.user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }

      // Call pre-processor to decide what to do
      const preProcessorDecision = await callPreProcessor(
        validatedData.message,
        chat.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
      );

      // Create user message
      await prisma.aIChatMessage.create({
        data: {
          chatId: chat.id,
          role: "user",
          content: validatedData.message,
        },
      });

      // Update chat lastMessageAt
      await prisma.aIChat.update({
        where: { id: chat.id },
        data: { lastMessageAt: new Date() },
      });

      // Optimization: Determine if we need to include recent notes in user context
      // Only include them if the pre-processor doesn't suggest using a tool (to avoid redundant data)
      // This prevents unnecessary database queries and reduces prompt size when tools will provide the needed data
      const includeRecentNotes = preProcessorDecision.nextStep !== "useTool";

      // Get user context
      const userContext = await getUserContext(
        session.user.id,
        includeRecentNotes,
      );
      const systemPrompt = await buildSystemPrompt(
        userContext,
        session.user.id,
      );

      // Build messages array for the LLM
      let messages = [
        { role: "system", content: systemPrompt },
        ...chat.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content: validatedData.message },
      ];

      // If pre-processor suggests using a tool, execute it first
      if (
        preProcessorDecision.nextStep === "useTool" &&
        preProcessorDecision.tool
      ) {
        let toolToExecute: string = preProcessorDecision.tool;

        // Handle "unknown" tool case
        if (
          preProcessorDecision.tool === "unknown" &&
          preProcessorDecision.needed
        ) {
          // Map the needed data type to the actual tool name
          const toolMap: Record<string, string> = {
            getNotes: "getUserNotes",
            getArticles: "getUserArticles",
            getArticlesWithBody: "getArticlesWithBody",
          };
          toolToExecute =
            toolMap[preProcessorDecision.needed] || "getUserNotes";
        }

        const toolResult = await executeTool(
          toolToExecute,
          session.user.id,
          preProcessorDecision.amount || 10,
        );

        // Add tool result to the conversation context
        messages.push({
          role: "system",
          content: `Tool ${toolToExecute} returned:\n${toolResult}\n\n${
            preProcessorDecision.otherLLMPrompt
              ? `User's request context: ${preProcessorDecision.otherLLMPrompt}`
              : "Use this information to answer the user's question."
          }`,
        });
      }

      // Stream response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          let fullResponse = "";

          try {
            // Create assistant message placeholder
            const assistantMessage = await prisma.aIChatMessage.create({
              data: {
                chatId: chat.id,
                role: "assistant",
                content: "", // Will be updated as we stream
                functionCalls: preProcessorDecision.tool
                  ? { tool: preProcessorDecision.tool }
                  : undefined,
              },
            });

            // If generating content, stream status first
            if (
              preProcessorDecision.tool === "generateNotes" ||
              preProcessorDecision.tool === "generateArticleIdeas"
            ) {
              const statusMessage =
                preProcessorDecision.tool === "generateNotes"
                  ? "Generating personalized notes..."
                  : "Generating article ideas and outlines...";

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ token: statusMessage + "\n\n" })}\n\n`,
                ),
              );
              fullResponse += statusMessage + "\n\n";
            }

            for await (const chunk of runPromptStream(
              messages,
              "anthropic/claude-3.7-sonnet",
            )) {
              fullResponse += chunk;

              // Send the chunk to the client
              const data = JSON.stringify({ token: chunk });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Update the assistant message with full content
            await prisma.aIChatMessage.update({
              where: { id: assistantMessage.id },
              data: { content: fullResponse },
            });

            // Send done signal
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
            );
          } catch (error) {
            console.error("Streaming error:", error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`,
              ),
            );
          } finally {
            controller.close();
          }
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Create new chat
      const validatedData = createChatSchema.parse(body);

      // Call pre-processor to decide what to do
      const preProcessorDecision = await callPreProcessor(
        validatedData.message,
        [],
      );

      // Create chat with first message
      const chat = await prisma.aIChat.create({
        data: {
          userId: session.user.id,
          title: validatedData.message.substring(0, 50) + "...",
          lastMessageAt: new Date(),
          messages: {
            create: {
              role: "user",
              content: validatedData.message,
            },
          },
        },
      });

      // Determine if we need to include recent notes in user context
      // Only include them if the pre-processor doesn't suggest using a tool (to avoid redundant data)
      const includeRecentNotes = preProcessorDecision.nextStep !== "useTool";

      // Get user context
      const userContext = await getUserContext(
        session.user.id,
        includeRecentNotes,
      );
      const systemPrompt = await buildSystemPrompt(
        userContext,
        session.user.id,
      );

      // Build messages array
      let messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: validatedData.message },
      ];

      // If pre-processor suggests using a tool, execute it first
      if (
        preProcessorDecision.nextStep === "useTool" &&
        preProcessorDecision.tool
      ) {
        let toolToExecute: string = preProcessorDecision.tool;

        // Handle "unknown" tool case
        if (
          preProcessorDecision.tool === "unknown" &&
          preProcessorDecision.needed
        ) {
          // Map the needed data type to the actual tool name
          const toolMap: Record<string, string> = {
            getNotes: "getUserNotes",
            getArticles: "getUserArticles",
            getArticlesWithBody: "getArticlesWithBody",
          };
          toolToExecute =
            toolMap[preProcessorDecision.needed] || "getUserNotes";
        }

        const toolResult = await executeTool(
          toolToExecute,
          session.user.id,
          preProcessorDecision.amount || 10,
        );

        // Add tool result to the conversation context
        messages.push({
          role: "system",
          content: `Tool ${toolToExecute} returned:\n${toolResult}\n\n${
            preProcessorDecision.otherLLMPrompt
              ? `User's request context: ${preProcessorDecision.otherLLMPrompt}`
              : "Use this information to answer the user's question."
          }`,
        });
      }

      // Stream response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          let fullResponse = "";

          try {
            // Send chat ID first
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ chatId: chat.id })}\n\n`,
              ),
            );

            // Create assistant message placeholder
            const assistantMessage = await prisma.aIChatMessage.create({
              data: {
                chatId: chat.id,
                role: "assistant",
                content: "",
                functionCalls: preProcessorDecision.tool
                  ? { tool: preProcessorDecision.tool }
                  : undefined,
              },
            });

            for await (const chunk of runPromptStream(
              messages,
              "anthropic/claude-3.7-sonnet",
            )) {
              fullResponse += chunk;

              // Send the chunk to the client
              const data = JSON.stringify({ token: chunk });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Update the assistant message
            await prisma.aIChatMessage.update({
              where: { id: assistantMessage.id },
              data: { content: fullResponse },
            });

            // Send done signal
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
            );
          } catch (error) {
            console.error("Streaming error:", error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`,
              ),
            );
          } finally {
            controller.close();
          }
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
