import axios from "axios";

export async function urlToFile(
  url: string,
  options?: { filename?: string; mimeType?: string },
): Promise<File> {
  try {
    const response = await axios.post(
      "/api/file-to-url",
      { url },
      {
        responseType: "blob", // This is the magic.
      },
    );

    const blob = response.data;
    debugger;
    // or random string
    const name =
      options?.filename || Math.random().toString(36).substring(2, 15);
    debugger;
    const type = options?.mimeType || blob.type;
    debugger;

    const fileEnding = type.split("/")[1] || "png";
    const fileName = `${name}.${fileEnding}`;

    return new File([blob], fileName, { type });
  } catch (error) {
    debugger;
    console.error("Failed to convert URL to file:", error);
    throw error;
  }
}
