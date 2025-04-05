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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const cookies: SubstackCookie[] = schema.parse(body);

    await setSubstackCookies(session.user.id, cookies);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
