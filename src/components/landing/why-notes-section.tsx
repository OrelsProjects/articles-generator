import { MasonryGrid } from "@/components/ui/masonry-grid";
import Image from "next/image";

const images = [
  {
    src: "/landing/notes/ana-notes.png",
    alt: "Ana Notes",
  },
  {
    src: "/landing/notes/yana-notes-proof.png",
    alt: "Yana Proof",
  },
  {
    src: "/landing/notes/philip-notes.png",
    alt: "Philip Notes",
  },
  {
    src: "/landing/notes/mcilroy-notes.png",
    alt: "McIlroy Notes",
  },
  {
    src: "/landing/notes/yana-notes.png",
    alt: "Yana Notes",
  },
  {
    src: "/landing/notes/maya-notes.png",
    alt: "Maya Notes",
  },
];

function CardComponent({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg shadow-md">
      <Image src={src} alt={alt} width={700} height={700} />
    </div>
  );
}

// Transform notes into the format expected by MasonryGrid
const gridCards = images.map(image => {
  return {
    id: image.src,
    className: "col-span-1",
    content: <CardComponent src={image.src} alt={image.alt} />,
  };
});

export default function WhyNotesSection() {
  return (
    <section className="landing-section-container bg-background flex flex-col gap-4 rounded-[3rem] shadow-[0_0_10px_rgba(0,0,0,0.2)] px-6 md:px-0">
      <div className="mx-auto md:px-0 landing-section-top">
        <h2 className="mb-4">
          Notes has one of the highest ROI when it comes to
          <br /> <span className="text-primary">growing</span> on Substack
        </h2>
        <p className="text-center">But don&apos;t take it from me.</p>
      </div>
      <MasonryGrid cards={gridCards} columns={2} gap={3} />
    </section>
  );
}
