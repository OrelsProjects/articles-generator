import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/auth/authOptions";
import { prisma } from "@/app/api/_db/db";
import { z } from "zod";

// Schema for validating the request body
const updatePublicationSettingsSchema = z.object({
  preferredTopics: z.array(z.string()).optional(),
  personalDescription: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user's publication metadata
    const userMetadata = await prisma.userMetadata.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        publication: true,
      },
    });

    // Check if the user has a publication
    if (!userMetadata?.publicationId) {
      return NextResponse.json(
        { error: "No publication found" },
        { status: 404 },
      );
    }

    // Return the publication settings
    return NextResponse.json({
      settings: {
        preferredTopics: userMetadata.publication?.preferredTopics || [],
        personalDescription:
          userMetadata.publication?.personalDescription || "",
        userSettingsUpdatedAt:
          userMetadata.publication?.userSettingsUpdatedAt || null,

        // Include generated data for reference
        generatedDescription:
          userMetadata.publication?.generatedDescription || "",
        generatedTopics: userMetadata.publication?.topics || "",
      },
    });
  } catch (error) {
    console.error("Error fetching publication settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch publication settings" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse and validate the request body
    const body = await req.json();
    const validatedData = updatePublicationSettingsSchema.parse(body);

    // Get the user's publication metadata
    const userMetadata = await prisma.userMetadata.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    // Check if the user has a publication
    if (!userMetadata?.publicationId) {
      return NextResponse.json(
        { error: "No publication found" },
        { status: 404 },
      );
    }

    // Update the publication settings
    const updatedPublication = await prisma.publicationMetadata.update({
      where: {
        id: userMetadata.publicationId,
      },
      data: {
        ...(validatedData.preferredTopics && {
          preferredTopics: validatedData.preferredTopics,
        }),
        ...(validatedData.personalDescription && {
          personalDescription: validatedData.personalDescription,
        }),
        userSettingsUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        preferredTopics: updatedPublication.preferredTopics,
        personalDescription: updatedPublication.personalDescription,
        userSettingsUpdatedAt: updatedPublication.userSettingsUpdatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating publication settings:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update publication settings" },
      { status: 500 },
    );
  }
}
