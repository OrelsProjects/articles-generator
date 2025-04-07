import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { SubstackCookie } from "@/types/useSubstack.type";
import { z } from "zod";
import { setSubstackCookies } from "@/lib/dal/substackCookies";

export const revalidate = 0;

const schema = z.array(
  z.object({
    name: z.enum(["substack.sid", "substack.lli", "__cf_bm"]),
    value: z.string(),
    expiresAt: z.number().nullable(),
    domain: z.string(),
    path: z.string(),
    secure: z.boolean(),
    httpOnly: z.boolean(),
    sameSite: z.enum(["no_restriction", "lax", "strict", "unspecified"]),
  }),
);

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin":
        "chrome-extension://bmkhkeelhgcnpmemdmlfjfndcolhhkaj",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  console.log(session);
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const cookies: SubstackCookie[] = schema.parse(body);

    await setSubstackCookies(session.user.id, cookies);

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin":
          "chrome-extension://bmkhkeelhgcnpmemdmlfjfndcolhhkaj",
      },
    });
  } catch (error) {
    console.error("Error saving cookies:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin":
            "chrome-extension://bmkhkeelhgcnpmemdmlfjfndcolhhkaj",
        },
      },
    );
  }
}
