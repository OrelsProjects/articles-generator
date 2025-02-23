import {
  Poppins as PoppinsFont,
  Gabarito as GabaritoFont,
  Montserrat,
  Lora as LoraFont,
  Plus_Jakarta_Sans,
} from "next/font/google";

export const Lora = LoraFont({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const Poppins = PoppinsFont({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const Gabarito = GabaritoFont({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
});

export const MontserratAlternates = Montserrat({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const PlusJakartaSans = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});
