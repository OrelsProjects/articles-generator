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

export const stripUrl = (
  url: string,
  options?: { removeWww?: boolean; removeDotCom?: boolean },
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
