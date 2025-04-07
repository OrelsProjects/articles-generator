import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const base64 = buffer.toString("base64");
    const dataUri = `data:image/png;base64,${base64}`;

    const response = await fetch("https://substack.com/api/v1/image", {
      headers: {
        "content-type": "application/json",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: JSON.stringify({
        image: dataUri,
      }),
      method: "POST",
    });

    return new Response(JSON.stringify({ base64: dataUri }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Error converting image:", err);
    return new Response(JSON.stringify({ error: "Failed to convert image" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
