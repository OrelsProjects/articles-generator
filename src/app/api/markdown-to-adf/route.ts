import { NextRequest, NextResponse } from "next/server";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { ADFNode, transformNode } from "@/lib/utils/adf";

function markdownToADF(markdown: string) {
  const tree = unified().use(remarkParse).parse(markdown);

  const paragraphs = tree.children
    .map((node: any) => transformNode(node, []))
    .filter(Boolean) as ADFNode[];

  return {
    type: "doc",
    attrs: { schemaVersion: "v1" },
    content: paragraphs,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { markdown } = await req.json();

    if (typeof markdown !== "string") {
      return NextResponse.json(
        { error: "Invalid markdown input" },
        { status: 400 },
      );
    }

    const adf = markdownToADF(markdown);

    return NextResponse.json(adf);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", detail: err.message },
      { status: 500 },
    );
  }
}
