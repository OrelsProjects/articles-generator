import { prisma } from "@/lib/prisma";
import { GhostwriterAccess  , GhostwriterClient } from "@/types/ghost-writer";
import { generateToken } from "@/lib/utils/token";
import { Ghostwriter, Note, S3Attachment } from "@prisma/client";
import loggerServer from "@/loggerServer";

export class GhostwriterDAL {
  // Profile operations
  static async getProfile(userId: string) {
    return await prisma.ghostwriter.findUnique({
      where: { userId },
    });
  }

  static async createProfile(userId: string, name: string, image: string) {
    return await prisma.ghostwriter.create({
      data: {
        userId,
        name,
        image,
        token: generateToken(),
      },
    });
  }

  static async updateProfile(userId: string, name: string, image: string) {
    return await prisma.ghostwriter.update({
      where: { userId },
      data: { name, image },
    });
  }

  static async createOrUpdateProfile(
    userId: string,
    name: string,
    image: string,
  ) {
    const existingGhostwriter = await this.getProfile(userId);

    if (existingGhostwriter) {
      return await this.updateProfile(userId, name, image);
    } else {
      return await this.createProfile(userId, name, image);
    }
  }

  // Access list operations (from account user perspective)
  static async getAccessList(
    accountUserId: string,
  ): Promise<GhostwriterAccess[]> {
    const ghostwriterAccess = await prisma.ghostwriterAccess.findMany({
      where: {
        accountUserId,
        isActive: true,
      },
      include: {
        ghostWriter: true,
      },
    });

    return ghostwriterAccess.map(access => ({
      id: access.id,
      accountUserId: access.accountUserId,
      accessLevel: access.accessLevel,
      isActive: access.isActive,
      createdAt: access.createdAt.toISOString(),
      updatedAt: access.updatedAt.toISOString(),
      ghostwriter: {
        id: access.ghostWriter.id,
        name: access.ghostWriter.name,
        image: access.ghostWriter.image,
      },
    }));
  }

  // Access management operations
  static async findGhostwriterByToken(token: string) {
    return await prisma.ghostwriter.findUnique({
      where: { token },
    });
  }

  static async checkExistingAccess(
    accountUserId: string,
    ghostwriterId: string,
  ) {
    return await prisma.ghostwriterAccess.findUnique({
      where: {
        accountUserId_ghostwriterId: {
          accountUserId,
          ghostwriterId,
        },
        isActive: true,
      },
      include: {
        ghostWriter: true,
      },
    });
  }

  static async createAccess(data: {
    accountUserId: string;
    ghostwriterUserId: string;
    ghostwriterId: string;
    accessLevel: "full" | "editor";
  }) {
    const { accountUserId, ghostwriterUserId, ghostwriterId, accessLevel } =
      data;
    const access = await prisma.ghostwriterAccess.create({
      data: {
        accountUserId,
        ghostwriterUserId,
        ghostwriterId,
        accessLevel,
        isActive: true,
      },
    });
    return await prisma.ghostwriterAccess.findUnique({
      where: {
        id: access.id,
      },
      include: {
        ghostWriter: true,
      },
    });
  }

  static async updateAccess(
    accountUserId: string,
    ghostwriterUserId: string,
    accessLevel: "full" | "editor",
    isActive: boolean,
  ) {
    return await prisma.ghostwriterAccess.update({
      where: {
        accountUserId_ghostwriterUserId: {
          accountUserId,
          ghostwriterUserId,
        },
      },
      data: {
        accessLevel,
        isActive,
      },
    });
  }

  static async revokeAccess(accessId: string) {
    return await prisma.ghostwriterAccess.delete({
      where: {
        id: accessId,
      },
    });
  }

  // Client operations (from ghostwriter perspective)
  static async getClients(userId: string): Promise<GhostwriterClient[]> {
    // First, get the user's ghostwriter profile
    const ghostwriter = await this.getProfile(userId);

    if (!ghostwriter) {
      return [];
    }

    // Get all clients where this user is the ghostwriter
    const clientAccess = await prisma.ghostwriterAccess.findMany({
      where: {
        ghostwriterId: ghostwriter.id,
      },
      include: {
        accountUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return clientAccess.map(access => ({
      id: access.id,
      accountUserId: access.accountUser.id,
      accountUserName: access.accountUser.name || "Unknown",
      accountUserEmail: access.accountUser.email || "",
      accountUserImage: access.accountUser.image || "",
      accessLevel: access.accessLevel,
      isActive: access.isActive,
      createdAt: access.createdAt.toISOString(),
      updatedAt: access.updatedAt.toISOString(),
    }));
  }

  static async stopGhostwriting(
    userId: string,
    accessId: string,
  ): Promise<GhostwriterClient | null> {
    // Verify the access belongs to this ghostwriter
    const access = await prisma.ghostwriterAccess.findUnique({
      where: {
        id: accessId,
      },
    });

    if (!access) {
      throw new Error("Access not found");
    }

    // Set isActive to false (stop ghostwriting)
    const updatedAccess = await prisma.ghostwriterAccess.update({
      where: { id: accessId },
      data: { isActive: false },
      include: {
        accountUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return {
      id: updatedAccess.id,
      accountUserId: updatedAccess.accountUser.id,
      accountUserName: updatedAccess.accountUser.name || "Unknown",
      accountUserEmail: updatedAccess.accountUser.email || "",
      accountUserImage: updatedAccess.accountUser.image || "",
      accessLevel: updatedAccess.accessLevel,
      isActive: updatedAccess.isActive,
      createdAt: updatedAccess.createdAt.toISOString(),
      updatedAt: updatedAccess.updatedAt.toISOString(),
    };
  }

  static async canRunOnBehalfOf(data: {
    ghostwriterUserId: string;
    clientId: string;
  }) {
    const { ghostwriterUserId, clientId } = data;
    const ghostWriter = await prisma.ghostwriter.findUnique({
      where: {
        userId: ghostwriterUserId,
      },
    });
    if (!ghostWriter) {
      return false;
    }

    const access = await prisma.ghostwriterAccess.findUnique({
      where: {
        accountUserId_ghostwriterId: {
          accountUserId: clientId,
          ghostwriterId: ghostWriter.id,
        },
        isActive: true,
      },
    });
    return access !== null;
  }

  static async getClientNotes(
    ghostwriterUserId: string,
    clientId: string,
  ): Promise<{
    error?: string;
    status: "error" | "success";
    statusCode: number;
    notes:
      | (Note & {
          S3Attachment: S3Attachment[];
          ghostwriter: Ghostwriter | null;
        })[]
      | null;
  }> {
    // Check first if the ghostwriter has access to the client
    const canRun = await this.canRunOnBehalfOf({ ghostwriterUserId, clientId });
    if (!canRun) {
      loggerServer.error("Unauthorized ghostwriter access", {
        userId: ghostwriterUserId,
        clientId,
      });
      return {
        error: "Access not found",
        status: "error",
        statusCode: 403,
        notes: null,
      };
    }

    // Get the notes for the client
    const notes = await prisma.note.findMany({
      where: {
        userId: clientId,
        ghostwriterUserId: ghostwriterUserId,
        isArchived: false,
      },
      include: {
        S3Attachment: true,
        ghostwriter: true,
      },
    });

    return {
      status: "success",
      statusCode: 200,
      notes,
    };
  }
}
