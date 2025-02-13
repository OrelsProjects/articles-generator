"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { usePathname } from "next/navigation";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname();

  return (
    <NextThemesProvider attribute="class" forcedTheme="light" {...props}>
      {children}
    </NextThemesProvider>
  );
}
