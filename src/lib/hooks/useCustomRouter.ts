"use client";

import { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter, useSearchParams } from "next/navigation";

export interface CustomRouterOptions {
  preserveQuery?: boolean | null; // Use null for now to not preserve query and not break existing code
  paramsToRemove?: string[];
  paramsToAdd?: Record<string, string>;
  newTab?: boolean;
}

export function useCustomRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const push = (
    href: string,
    routerOptions: CustomRouterOptions = { preserveQuery: true },
    options?: NavigateOptions,
  ) => {
    debugger;
    // If relative URL, prepend the current origin
    const baseUrl = href.startsWith("http")
      ? href
      : `${window.location.origin}${href}`;
    const url = new URL(baseUrl);

    if (routerOptions?.preserveQuery) {
      searchParams.forEach((val, key) => {
        if (!url.searchParams.has(key)) {
          url.searchParams.append(key, val);
        }
      });
    }

    if (routerOptions?.paramsToRemove) {
      routerOptions.paramsToRemove.forEach(key => {
        url.searchParams.delete(key);
      });
    }

    if (routerOptions?.paramsToAdd) {
      Object.entries(routerOptions.paramsToAdd).forEach(([key, val]) => {
        if (val) {
          url.searchParams.set(key, val); // Use set to ensure updated values replace old ones
        }
      });
    }

    let urlString = url.toString();

    // If the href argument was relative, revert it back to relative for router.push
    if (!href.startsWith("http")) {
      urlString = url.pathname + url.search;
    }
    if (routerOptions?.newTab) {
      window.open(urlString, "_blank");
    } else {
      router.push(urlString, options);
    }
  };

  return { ...router, push };
}
