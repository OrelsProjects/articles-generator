import { OpenGraphResponse } from "@/types/og";
import ogs from "open-graph-scraper";


export async function getOg(url: string): Promise<OpenGraphResponse | null> {
  const response = await ogs({ url });
  if (response.error) {
    return null;
  }
  return response.result as unknown as OpenGraphResponse;
}