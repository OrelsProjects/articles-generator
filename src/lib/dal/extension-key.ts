import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.EXTENSION_JWT_SECRET as string;

async function deactivateKeysForUser(
  userId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx || prisma;
  await db.extensionKeys.updateMany({
    where: { userId },
    data: { isActive: false },
  });
}

function generateKey(userId: string, authorId: number) {
  const token = jwt.sign(
    { userId, authorId }, // payload
    JWT_SECRET, // secret
    { expiresIn: "999999d" },
  );
  return token;
}

export async function generateExtensionKey(userId: string, authorId: number) {
  const key = generateKey(userId, authorId);
  // run in transaction
  await prisma.$transaction(async tx => {
    await deactivateKeysForUser(userId, tx);
    await tx.extensionKeys.create({
      data: { userId, key, isActive: true },
    });
  });
  return key;
}

export async function getExtensionKey(userId: string) {
  const result = await prisma.extensionKeys.findFirst({
    where: { userId, isActive: true },
    select: { key: true },
  });
  if (!result) {
    return null;
  }
  return result.key;
}

export function decodeKey(key: string) {
  return jwt.verify(key, JWT_SECRET) as { userId: string; authorId: number };
}

export function verifyKey(key: string, userId: string, authorId: number) {
  const decoded = decodeKey(key);
  if (decoded.userId !== userId || decoded.authorId !== authorId) {
    return false;
  }
  return true;
}
