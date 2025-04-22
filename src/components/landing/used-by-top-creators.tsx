import Image from "next/image";
import { cn } from "@/lib/utils";

const TOP_CREATORS = [
  "/testimonials/david-mcilroy.jpg",
  "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fdc125fa8-cfe4-438f-9b30-375d783f944b_865x865.jpeg",
  "/tim-denning.png",
  "/sinem-gunel.jpg",
  "/testimonials/kacper-wojaczek.png",
  "/testimonials/jari-roomer.jpg",
  "https://substack-post-media.s3.amazonaws.com/public/images/95cb46cf-ef70-48d6-a362-174a9dc489af_3024x3024.jpeg",
  "https://substack-post-media.s3.amazonaws.com/public/images/c73dc80d-8611-44fa-a17d-33461220c621_678x678.png",
];

export const UsedByTopCreators = () => {
  return (
    <section className="w-full py-14 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl text-primary-foreground mb-10">
          Used by top content creators worldwide
        </h2>

        <div className="flex justify-center">
          <div className="flex -space-x-4 overflow-hidden">
            {TOP_CREATORS.map((creator, index) => (
              <div
                key={index}
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 ",
                  "transform transition-all duration-300 hover:z-10",
                  "flex items-center justify-center overflow-hidden",
                  "bg-white",
                )}
                style={{ zIndex: TOP_CREATORS.length - index }}
              >
                <Image
                  src={creator}
                  alt={`Creator ${index + 1}`}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
