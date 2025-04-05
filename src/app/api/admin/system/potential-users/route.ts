import prisma, { prismaArticles } from "@/app/api/_db/db";
import { authOptions } from "@/auth/authOptions";
import loggerServer from "@/loggerServer";
import { PotentialClientStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

async function getPostsWithStatus() {
  const relevantPosts: {
    canonical_url: string;
    title: string;
    post_date: string;
    publication_name: string;
    publication_id: number;
    reaction_count: number;
  }[] = await prismaArticles.$queryRaw`
      WITH ranked_posts AS (
          SELECT p.*,
                 ROW_NUMBER() OVER (PARTITION BY p.title ORDER BY p.post_date DESC) AS rn
          FROM posts p
          WHERE p.post_date > '2025-01-01'
      )
      SELECT 
          rp.canonical_url as canonical_url, 
          rp.title, 
          rp.post_date as post_date, 
          pub.name AS publication_name, 
          CAST(pub.id AS INTEGER) AS publication_id, 
          CAST(rp.reaction_count AS INTEGER) as reaction_count
      FROM ranked_posts rp
      JOIN publications pub ON CAST(rp.publication_id AS INT) = pub.id
      WHERE rp.rn = 1
      AND rp.title IN (
          SELECT title
          FROM posts
          WHERE post_date > '2025-01-01' AND reaction_count < 2 AND reaction_count > 0
          GROUP BY title
          HAVING COUNT(*) > 1
      );`;

  // Convert BigInt to Number in the response
  const serializedPosts = relevantPosts.map(post => ({
    ...post,
    publicationId: Number(post.publication_id),
    reactionCount: Number(post.reaction_count),
    scheduledTo: post.post_date ? new Date(post.post_date).toISOString() : null,
    publicationName: post.publication_name,
    canonicalUrl: post.canonical_url,
    title: post.title,
  }));

  const potentialClients = await prisma.potentialClients.findMany();
  const potentialClientsMap = new Map(
    potentialClients.map(client => [client.canonicalUrl, client]),
  );

  const newPotentialClients = serializedPosts.filter(
    post => !potentialClientsMap.has(post.canonicalUrl),
  );

  if (newPotentialClients.length > 0) {
    const newPotentialClientsData = newPotentialClients.map(post => ({
      canonicalUrl: post.canonicalUrl,
      status: PotentialClientStatus.new,
      title: post.title,
      publicationId: `${post.publicationId}`,
      reactionCount: post.reactionCount,
      scheduledTo: post.scheduledTo,
      publicationName: post.publicationName,
    }));

    await prisma.potentialClients.createMany({
      data: newPotentialClientsData,
    });
  }

  // add status to all posts
  const postsWithStatus = serializedPosts
    .map(post => ({
      ...post,
      status:
        potentialClientsMap.get(post.canonicalUrl)?.status ||
        PotentialClientStatus.new,
      //   firstMessage:
      //     potentialClientsMap.get(post.canonicalUrl)?.firstMessage || null,
    }))
    .filter(post => post.status !== PotentialClientStatus.deleted);

  return postsWithStatus;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.meta?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const postsWithStatus = await prisma.potentialClients.findMany({
      where: {
        status: {
          not: PotentialClientStatus.deleted,
        },
      },
    });
    return NextResponse.json(postsWithStatus);
  } catch (error: any) {
    loggerServer.error("Error in potential-users route:", error);
    return NextResponse.json(
      { error: "Failed to fetch potential users" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const { canonicalUrl, status } = await req.json();
  await prisma.potentialClients.update({
    where: { canonicalUrl },
    data: { status },
  });

  return NextResponse.json({ message: "Potential client updated" });
}
