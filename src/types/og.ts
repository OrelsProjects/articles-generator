export type OpenGraphResponse = {
  success?: boolean
  author?: string;
  ogUrl?: string;
  ogType?: string;
  ogTitle?: string;
  twitterTitle?: string;
  ogDescription?: string;
  twitterDescription?: string;
  twitterCard?: string;
  publication?: {
    name: string;
    logo: {
      url: string;
    };
  };
  ogImage: {
    url: string;
    type: string;
  }[];
  twitterImage: {
    url: string;
  }[];
  ogLocale: string;
  favicon?: string;
  charset: string;
  jsonLD: {
    "@context": string;
    "@type": string;
    url: string;
    mainEntityOfPage: string;
    headline: string;
    description: string;
    image: {
      "@type": string;
      url: string;
    }[];
    datePublished: string;
    dateModified: string;
    isAccessibleForFree: boolean;
    author: {
      "@type": string;
      name: string;
      url: string;
      description: string;
      identifier: string;
      image: {
        "@type": string;
        contentUrl: string;
        thumbnailUrl: string;
      };
    }[];
    publisher: {
      "@type": string;
      name: string;
      url: string;
      description: string;
      interactionStatistic: {
        "@type": string;
        name: string;
        interactionType: string;
        userInteractionCount: number;
      };
      identifier: string;
      logo: {
        "@type": string;
        url: string;
        contentUrl: string;
        thumbnailUrl: string;
      };
      image: {
        "@type": string;
        url: string;
        contentUrl: string;
        thumbnailUrl: string;
      };
    };
  }[];
  requestUrl: string;
};
