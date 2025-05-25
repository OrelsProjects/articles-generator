import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { prisma, prismaArticles } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { runPromptStream } from "@/lib/open-router";
import { z } from "zod";
import { IdeaStatus } from "@prisma/client";
import { getAuthorId } from "@/lib/dal/publication";

const createChatSchema = z.object({
  message: z.string().min(1).max(10000),
});

const sendMessageSchema = z.object({
  chatId: z.string(),
  message: z.string().min(1).max(10000),
});

// Pre-processor response schema
interface PreProcessorResponse {
  tool?: string;
  nextStep: "ready" | "useTool";
}

// Helper function to get user context
async function getUserContext(userId: string) {
  const userMetadata = await prisma.userMetadata.findUnique({
    where: { userId },
    include: {
      publication: true,
    },
  });

  const authorId = await getAuthorId(userId);
  let recentNotes: { body: string }[] = [];
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

  return {
    writingStyle:
      userMetadata?.noteWritingStyle ||
      userMetadata?.publication?.writingStyle ||
      "professional and clear",
    topics:
      userMetadata?.noteTopics ||
      userMetadata?.publication?.topics ||
      "general topics",
    personality:
      userMetadata?.publication?.personality || "helpful and focused",
    description:
      userMetadata?.notesDescription ||
      userMetadata?.publication?.generatedDescription ||
      "",
    recentNotes: recentNotes.map(note => ({
      preview: note.body.substring(0, 200) + "...",
    })),
  };
}

// Helper function to call GPT-4-Nano pre-processor
async function callPreProcessor(
  userMessage: string,
): Promise<PreProcessorResponse> {
  const preProcessorPrompt = `You are a routing engine that decides what action to take based on the user's request.

Available tools:
- getUserNotes: Returns the user's published and draft notes
- getUserArticles: Returns the user's articles

Analyze this request: "${userMessage}"

Respond ONLY with a JSON object in this exact format:
{
  "tool": "toolName" or null,
  "nextStep": "ready" or "useTool"
}

Rules:
- If the user asks about their past writing, notes, or articles, set tool to the appropriate tool name and nextStep to "useTool"
- If the user wants to generate new content or get help with writing, set tool to null and nextStep to "ready"
- If the user mentions searching their content or finding something they wrote, use the appropriate tool
- Default to "ready" if unsure`;

  try {
    // Use the OpenRouter API directly for a single response
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: preProcessorPrompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 100,
        }),
      },
    );

    if (!response.ok) {
      console.error("Pre-processor API error:", await response.text());
      return { nextStep: "ready" };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "{}";

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        tool: parsed.tool || undefined,
        nextStep: parsed.nextStep || "ready",
      };
    } catch (e) {
      console.error("Failed to parse pre-processor response:", content);
      return { nextStep: "ready" };
    }
  } catch (error) {
    console.error("Pre-processor error:", error);
    return { nextStep: "ready" };
  }
}

// Helper function to execute tools
async function executeTool(toolName: string, userId: string): Promise<string> {
  try {
    // Instead of making HTTP calls, directly execute the tool logic
    switch (toolName) {
      case "getUserNotes": {
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
          take: 100,
        });

        return `Found ${notes.length} notes. Here are the most recent ones:\n\n${notes
          .slice(0, 10)
          .map(
            (note: any) =>
              `- ${note.summary} (Topics: ${note.topics.join(", ")})\n  Status: ${note.status}, Created: ${new Date(note.createdAt).toLocaleDateString()}`,
          )
          .join("\n\n")}`;
      }

      case "getUserArticles": {
        const articles = await prisma.idea.findMany({
          where: {
            userId: userId,
            status: { not: IdeaStatus.archived },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            subtitle: true,
            description: true,
            body: true,
            topic: true,
            status: true,
            createdAt: true,
          },
          take: 50,
        });

        return `Found ${articles.length} articles. Here are the most recent ones:\n\n${articles
          .slice(0, 10)
          .map(
            (article: any) =>
              `- "${article.title}" - ${article.subtitle}\n  ${article.description}`,
          )
          .join("\n\n")}`;
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
function buildSystemPrompt(userContext: any) {
  return `You are WriteStack MCP – a deeply integrated AI writing companion built into the user's editor. You operate with full access to the user's context, tone, and writing style. You are their second brain – focused, efficient, and never preachy.

You're not a generic chatbot. You're a high-IQ writing assistant that helps the user generate, improve, or rework content based on their past work.

User's Writing Context:
- Writing Style: ${userContext.writingStyle}
- Common Topics: ${userContext.topics}
- Personality: ${userContext.personality}
- About: ${userContext.description}

Recent Notes Preview:
${userContext.recentNotes?.map((note: any) => `- ${note.preview}`).join("\n")}

Your outputs must always:
- Match the user's writing style described above
- Be practical, sharp, and non-repetitive
- Use clear formatting (headings, bullet points, spacing)
- Stream responses smoothly

When generating notes or articles, add the appropriate marker:
- For notes: Start with "[Generated Note]" or "## Note:"
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
      );

      // Create user message
      const userMessage = await prisma.aIChatMessage.create({
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

      // Get user context
      const userContext = await getUserContext(session.user.id);
      const systemPrompt = buildSystemPrompt(userContext);

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
        const toolResult = await executeTool(
          preProcessorDecision.tool,
          session.user.id,
        );

        // Add tool result to the conversation context
        messages.push({
          role: "system",
          content: `Tool ${preProcessorDecision.tool} returned:\n${toolResult}\n\nUse this information to answer the user's question.`,
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

            for await (const chunk of runPromptStream(
              messages,
              "anthropic/claude-3.5-sonnet",
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

      // Get user context
      const userContext = await getUserContext(session.user.id);
      const systemPrompt = buildSystemPrompt(userContext);

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
        const toolResult = await executeTool(
          preProcessorDecision.tool,
          session.user.id,
        );

        // Add tool result to the conversation context
        messages.push({
          role: "system",
          content: `Tool ${preProcessorDecision.tool} returned:\n${toolResult}\n\nUse this information to answer the user's question.`,
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
              "anthropic/claude-3.5-sonnet",
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
