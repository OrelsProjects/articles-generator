import axiosInstance from "@/lib/axios-instance";

export async function urlToFile(
  url: string,
  options?: { filename?: string; mimeType?: string },
): Promise<File> {
  try {
    const response = await axiosInstance.post(
      "/api/file-to-url",
      { url },
      {
        responseType: "blob", // This is the magic.
      },
    );

    const blob = response.data;
    
    // or random string
    const name =
      options?.filename || Math.random().toString(36).substring(2, 15);
    
    const type = options?.mimeType || blob.type;
    

    const fileEnding = type.split("/")[1] || "png";
    const fileName = `${name}.${fileEnding}`;

    return new File([blob], fileName, { type });
  } catch (error) {
    
    console.error("Failed to convert URL to file:", error);
    throw error;
  }
}
