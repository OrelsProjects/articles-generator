import { markdownToADF } from "@/lib/utils/adf";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { markdown } = await req.json();

    if (typeof markdown !== "string") {
      return NextResponse.json(
        { error: "Invalid markdown input" },
        { status: 400 },
      );
    }

    const adf = await markdownToADF(markdown);

    return NextResponse.json(adf);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", detail: err.message },
      { status: 500 },
    );
  }
}
