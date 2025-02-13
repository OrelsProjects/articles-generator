import { Logger } from "@/logger";
import { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Options for the custom router.
 * @param preserveQuery - Whether to preserve the query params. Default is true.
 */
export interface CustomRouterOptions {
  preserveQuery?: boolean;
}

export function useCustomRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const push = (
    href: string,
    routerOptions: CustomRouterOptions = { preserveQuery: true },
    options?: NavigateOptions,
  ) => {
    // HACK: If relative URL given, stick the current host on the string passed to URL()
    // as the constructor throws an error if URL without a host is given
    try {
      const url = new URL(
        href.includes("http") ? href : window.location.host + href,
      );

      if (routerOptions?.preserveQuery) {
        searchParams.forEach((val, key) => {
          url.searchParams.append(key, val);
        });
      }

      let urlString = url.toString();

      // If the href arg was relative, strip everything before the first '/' to
      // revert it back to a relative URL we can pass into the router.push() method
      if (!href.includes("http")) {
        urlString = urlString.substring(urlString.indexOf("/"));
      }

      router.push(urlString, options);
    } catch (error: any) {
      Logger.error("Error parsing URL", error);
      router.push(href, options);
    }
  };

  return { ...router, push };
}
