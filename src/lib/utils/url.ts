const PUBLIC_SUFFIX_LIST = [
  "com",
  "co",
  "net",
  "org",
  "gov",
  "edu",
  "mil",
  "io",
  "dev",
  "ai",
  "app",
  "uk",
  "co.uk",
  "ac.uk",
  "de",
  "fr",
  "cn",
  "jp",
  "us",
  "ca",
  "au",
  "in",
  "tech",
  "xyz",
  "biz",
  "info",
  "me",
  "io",
  "tv",
  "store",
  "blog",
];

export const buildSubstackUrl = (
  subdomain?: string | null,
  customDomain?: string | null,
) => {
  if (subdomain) {
    return `https://${subdomain}.substack.com`;
  }
  if (customDomain) {
    return `https://${customDomain}`;
  }

  return null;
};

export const buildNewDraftUrl = (publicationUrl: string) => {
  const draftUrlString = `${publicationUrl}/publish/post?type=newsletter&back=/publish/home`;
  return draftUrlString;
};

const getUrlTLD = (url: string): string | null => {
  try {
    // Ensure URL has a scheme, otherwise add https://
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    const urlObj = new URL(url);
    const parts = urlObj.hostname.split(".");

    // Iterate backwards to check for multi-level TLDs
    for (let i = 1; i < parts.length; i++) {
      const possibleTLD = parts.slice(i).join(".");
      if (PUBLIC_SUFFIX_LIST.includes(possibleTLD)) {
        return possibleTLD;
      }
    }

    // If nothing matches, return last part (fallback)
    return parts.pop() ?? null;
  } catch (error) {
    console.error("Invalid URL:", url);
    return null;
  }
};

/**
 * Strip the URL of the protocol
 * @param url
 * @param options
 * @returns
 */
export const stripUrl = (
  url: string,
  options?: {
    removeWww?: boolean;
    removeDotCom?: boolean;
    removeQueryParams?: boolean;
  },
) => {
  let strippedUrl = url.replace("https://", "").replace("http://", "");
  if (strippedUrl.endsWith("/")) {
    strippedUrl = strippedUrl.slice(0, -1);
  }
  if (options?.removeWww) {
    strippedUrl = strippedUrl.replace("www.", "");
  }
  if (options?.removeDotCom) {
    strippedUrl = strippedUrl.replace(".com", "");
  }
  if (options?.removeQueryParams) {
    strippedUrl = strippedUrl.split("?")[0];
  }
  return strippedUrl;
};

export const toValidUrl = (url: string) => {
  const strippedUrl = stripUrl(url);
  return `https://${strippedUrl}`;
};

export const validateUrl = (url: string) => {
  try {
    new URL(toValidUrl(url));
    return true;
  } catch (error: any) {
    return false;
  }
};

/**
 * A Valid Substack URL can either be:
 * - https://[name].substack.com
 * - https://www.[name].com (Or any other ending than .com)
 * - https://[name].com (Or any other ending than .com)
 * Where name is not substack

 * @param url 
 * @returns 
 */
export const validateSubstackUrl = (url: string) => {
  const strippedUrl = stripUrl(url, {
    removeWww: true,
    removeQueryParams: true,
  });
  const isSubdomain = strippedUrl.includes("substack.com");
  if (isSubdomain) {
    // It should look like this: [name].substack.com after stripping the url
    const name = strippedUrl.split("substack.com")[0];
    if (!name) {
      return false;
    }
    return true;
  } else {
    // It should look like this: [name].com after stripping the url
    const tld = getUrlTLD(strippedUrl);
    if (!tld) {
      return false;
    } else {
      const name = strippedUrl.split(`.${tld}`)[0];
      if (!name) {
        return false;
      }
      return true;
    }
  }
};
