import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { prisma } from "@/lib/prisma";
import loggerServer from "@/loggerServer";
import { z } from "zod";
import { addTopicsString } from "@/lib/dal/topics";

// Schema for validating the onboarding data
const onboardingDataSchema = z.object({
  name: z.string().optional(),
  iAmA: z.string().optional(),
  usuallyPostAbout: z.string().optional(),
  writeInLanguage: z.string().default("en"),
  topics: z.array(z.string()).default([]),
  customTopics: z.string().optional(),
  customPrompt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText || "{}");
    loggerServer.info("Onboarding data", {
      body,
      userId: session.user.id,
    });
    const validatedData = onboardingDataSchema.parse(body);

    // Update user name if provided
    if (validatedData.name && validatedData.name !== session.user.name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: validatedData.name },
      });
    }

    // Get or create user metadata
    let userMetadata = await prisma.userMetadata.findFirst({
      where: { userId: session.user.id },
      include: { publication: true },
    });

    if (!userMetadata) {
      userMetadata = await prisma.userMetadata.create({
        data: {
          userId: session.user.id,
          preferredLanguage: validatedData.writeInLanguage,
          iAmA: validatedData.iAmA,
          usuallyPostAbout: validatedData.usuallyPostAbout,
        },
        include: { publication: true },
      });
    } else {
      // Update existing user metadata
      userMetadata = await prisma.userMetadata.update({
        where: { id: userMetadata.id },
        data: {
          preferredLanguage: validatedData.writeInLanguage,
          iAmA: validatedData.iAmA,
          usuallyPostAbout: validatedData.usuallyPostAbout,
        },
        include: { publication: true },
      });
    }

    loggerServer.info("Onboarding data", {
      userMetadata,
      userId: session.user.id,
    });

    await addTopicsString(validatedData.topics);

    // Update publication metadata if it exists
    if (userMetadata?.publication) {
      await prisma.publicationMetadata.update({
        where: { id: userMetadata.publication.id },
        data: {
          preferredTopics: validatedData.topics,
          personalDescription: validatedData.customPrompt,
          userSettingsUpdatedAt: new Date(),
        },
      });
    }

    await prisma.settings.update({
      where: { userId: session.user.id },
      data: {
        onboardingSetupCompleted: true,
      },
    });

    loggerServer.info("Onboarding data saved successfully", {
      userId: session.user.id,
      hasPublication: !!userMetadata?.publication,
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding data saved successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      loggerServer.warn("Invalid onboarding data", {
        userId: session.user.id,
        errors: error.errors,
      });
      return NextResponse.json(
        { error: "Invalid data format", details: error.errors },
        { status: 400 },
      );
    }

    loggerServer.error("Error saving onboarding data", {
      userId: session.user.id,
      error,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
