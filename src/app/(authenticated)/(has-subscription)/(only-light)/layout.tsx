import { ThemeProvider } from "@/app/providers/ThemeProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider forcedTheme="light">{children}</ThemeProvider>;
}
