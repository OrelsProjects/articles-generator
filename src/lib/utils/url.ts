export const stripUrl = (url: string) => {
  let strippedUrl = url
    .replace("https://", "")
    .replace("http://", "")
    .replace("www.", "");
  if (strippedUrl.endsWith("/")) {
    strippedUrl = strippedUrl.slice(0, -1);
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
  } catch (error) {
    return false;
  }
};
