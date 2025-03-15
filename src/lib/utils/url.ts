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

interface UrlComponents {
  validUrl: string;
  mainComponentInUrl: string;
}

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
  // Check if there's something after the last occurence of ".". For example abc.substack.com/p/hello-world should be abc.substack.com.
  // if so, remove everything after it.
  // how? find last dot, then the next occurence of "/".
  const lastDotIndex = strippedUrl.lastIndexOf(".");
  if (lastDotIndex !== -1) {
    const nextSlashIndex = strippedUrl.indexOf("/", lastDotIndex);
    if (nextSlashIndex !== -1) {
      strippedUrl = strippedUrl.slice(0, nextSlashIndex);
    }
  }
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

const removeQueryParams = (url: string) => {
  return url.split("?")[0];
};

export const getUrlComponents = (url: string): UrlComponents => {
  if (!url) {
    return { validUrl: "", mainComponentInUrl: "" };
  }
  let validUrl = url;
  let mainComponentInUrl = "";
  validUrl = removeQueryParams(validUrl);
  console.log("validUrl", validUrl);
  if (validUrl.endsWith("/")) {
    validUrl = validUrl.slice(0, -1);
  }
  if (!validUrl.includes("substack.com")) {
    const startsWithHttps = validUrl.startsWith("https://");
    const startsWithWWW = validUrl.startsWith("www.");
    const startsWithHttpsAndWWW = validUrl.startsWith("https://www.");

    if (!startsWithHttpsAndWWW) {
      if (startsWithWWW) {
        const urlWithoutWWW = validUrl.slice(4, validUrl.length);
        validUrl = `https://${validUrl}`;
        // remove www. from the url
        mainComponentInUrl = urlWithoutWWW.split(".")[0];
      } else if (startsWithHttps) {
        // if has 3 components, for example read.abc.com, no need www.
        if (validUrl.split(".").length >= 3) {
          // the main is the second one
          mainComponentInUrl = validUrl.split(".")[1];
        } else {
          validUrl =
            validUrl.slice(0, 8) + "www." + validUrl.slice(8, validUrl.length);
          // remove https://www. from the url
          const urlWithoutWWW = validUrl.slice(12, validUrl.length);
          mainComponentInUrl = urlWithoutWWW.split(".")[0];
        }
      } else {
        // Doesn't start with https://www.
        // if has 3 components, for example read.abc.com, no need www.
        if (validUrl.split(".").length >= 3) {
          mainComponentInUrl = validUrl.split(".")[1];
        } else {
          mainComponentInUrl = validUrl.split(".")[0];
          validUrl = `https://www.${validUrl}`;
        }
      }
    } else {
      console.log("validUrl", validUrl);
      // Starts with https://www.. It's a vlaid url, just remove everything after the first '/' after the last occurence of '.'
      // const urlNoSubstack = validUrl.slice(0, validUrl.indexOf("substack.com"));
      // remove https://www.
      const urlWithoutHttpsWWW = validUrl.slice(12, validUrl.length);
      mainComponentInUrl = urlWithoutHttpsWWW.split(".")[0];
      console.log("mainComponentInUrl", mainComponentInUrl);
    }
  } else {
    const urlNoSubstack = validUrl.slice(0, validUrl.indexOf("substack.com"));
    // remove https:// if there is
    const urlWithoutHttps = urlNoSubstack.startsWith("https://")
      ? urlNoSubstack.slice(8, urlNoSubstack.length)
      : urlNoSubstack;
    mainComponentInUrl = urlWithoutHttps.split(".")[0];
  }

  console.log("Done. startingUrl: ", url, "values: ", {
    validUrl,
    mainComponentInUrl,
  });

  // remove everything after the first '/' after the last occurence of '.'
  const lastDotIndex = validUrl.lastIndexOf(".");
  const firstSlashAfterLastDot = validUrl.indexOf("/", lastDotIndex);
  if (firstSlashAfterLastDot !== -1) {
    validUrl = validUrl.slice(0, firstSlashAfterLastDot);
  }

  if (validUrl.startsWith("https://")) {
    return { validUrl, mainComponentInUrl };
  } else {
    return { validUrl: `https://${validUrl}`, mainComponentInUrl };
  }
};
