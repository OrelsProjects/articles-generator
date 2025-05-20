import { Metadata } from "next";

const OG_IMAGE =
  "https://apps-og-images.s3.us-east-1.amazonaws.com/write-room/og/note-generator-post-og.png";

export const metadata: Metadata = {
  title: {
    default: "Notes Generator Post",
    template: "%s | Notes Generator Post",
  },
  description: "Generate a teasing note for you article - for free.",
  openGraph: {
    images: { url: OG_IMAGE, width: 1200, height: 630 }, // Default Open Graph image with recommended size.
  },
  twitter: {
    card: "summary_large_image", // Sets Twitter card type to 'summary', showing a small preview image and description. To show big image, use 'summary_large_image'.
    images: {
      url: OG_IMAGE,
      width: 1200,
      height: 630,
    }, // Image used in Twitter preview card with dimensions.
  },
};

export default function HeatmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
