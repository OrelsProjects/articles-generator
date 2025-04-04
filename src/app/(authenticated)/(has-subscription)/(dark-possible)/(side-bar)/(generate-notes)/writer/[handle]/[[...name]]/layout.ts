import { Metadata } from "next";

export let metadata: Metadata = {
  title: {
    default: "Writer",
    template: "%s | WriteRoom",
  },
  description: "Writer",
};

export default function WriterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { handle: string; name?: string; image?: string };
}) {
  if (params.name) {
    const name = decodeURIComponent(params.name || "");
    const formattedName = name
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    // unslugify the name and capitalize every word
    metadata.title = formattedName;
  }
  if (decodeURIComponent(params.image || "")) {
    metadata.openGraph = {
      images: [decodeURIComponent(params.image || "")],
    };
  }
  return children;
}
