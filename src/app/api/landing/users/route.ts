import prisma from "@/app/api/_db/db";
import { NextRequest, NextResponse } from "next/server";

const TOP_CREATORS = [
  "https://lh3.googleusercontent.com/a/ACg8ocJW9vQoeLaDEErukVxMRPyMVeIQjYJ7oiZv9JNKs9d5CCWFGb3P=s96-c",
  "https://lh3.googleusercontent.com/a/ACg8ocLzK54krzPKKX93T3tlnihb1S3O465db4Y_0HAfeklMOJ-WR04S=s96-c",
  "https://lh3.googleusercontent.com/a/ACg8ocK_w9wuAIXPAwkEYjPZQGHy5uU1mXt35P27odj-k5evvixqWGc=s96-c",
  "https://lh3.googleusercontent.com/a/ACg8ocJl9qDMPoGzx5ze3jjbjPSVgzqvSsy7YqHA55eqUxgh5fU3zu7b=s96-c",
  "https://lh3.googleusercontent.com/a/ACg8ocLG4ls3Xhzf8ejRKrnWv-_yyOkZkI3fmK3dyJI7DgzbaV7o7Ok=s96-c",
];
export async function GET(req: NextRequest) {
  const users = await prisma.user.findMany({
    select: {
      image: true,
    },
    where: {
      image: {
        not: null,
      },
    },
  });

  // rounded to closest complete number, ceiling
  const count = Math.ceil(users.length / 10) * 10;

  const topFiveImages = TOP_CREATORS;
  return NextResponse.json({ count: `${count.toString()}+`, topFiveImages });
}
