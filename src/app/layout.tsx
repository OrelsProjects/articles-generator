import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import ClientTrackersProvider from "@/app/providers/ClientTrackersProvider";
import SessionWrapper from "@/app/providers/SessionWrapper";
import StoreProvider from "@/app/providers/StoreProvider";
import TopLoaderProvider from "@/app/providers/TopLoaderProvider";
import Loading from "@/components/ui/loading";
import { initLogger } from "@/logger";
import { Suspense } from "react";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { Gabarito } from "@/lib/utils/fonts";
import { Metadata, Viewport } from "next";
import AnimationProvider from "@/app/providers/AnimationProvider";
import { cn } from "@/lib/utils";

interface RootLayoutProps {
  children: React.ReactNode;
  locale: never;
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME as string;
const APP_DEFAULT_TITLE = process.env.NEXT_PUBLIC_APP_DEFAULT_TITLE as string;
const APP_TITLE_TEMPLATE = process.env.NEXT_PUBLIC_APP_TITLE_TEMPLATE as string;
const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION as string;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL as string;
const APP_STARTUP_IMAGE = process.env.NEXT_PUBLIC_APP_STARTUP_IMAGE as string;
const TWITTER_OG_IMAGE_URL = process.env
  .NEXT_PUBLIC_TWITTER_OG_IMAGE_URL as string;

export const metadata: Metadata = {
  applicationName: APP_NAME, // Name of the application, used in app manifest files and app listing.
  title: {
    default: APP_DEFAULT_TITLE, // The default title shown on the browser tab if a specific page title is not set.
    template: APP_TITLE_TEMPLATE, // Template for titles to include page-specific titles followed by a default name.
  },
  description: APP_DESCRIPTION, // A brief description of the app, often used in search engines for SEO.
  appleWebApp: {
    capable: true, // Enables the app to be added to the home screen on iOS devices.
    statusBarStyle: "default", // Specifies the status bar appearance when the app is opened from the home screen.
    title: APP_DEFAULT_TITLE, // Title used when the app is saved on an iOS device.
    startupImage: APP_STARTUP_IMAGE, // URL for the app startup screen image, shown during app load on iOS.
  },
  formatDetection: {
    telephone: false, // Disables automatic phone number detection on iOS for text content.
  },
  openGraph: {
    type: "website", // Specifies the type of Open Graph object, in this case, a website.
    locale: "en_US", // Defines the locale in Open Graph for language and region (English, US).
    siteName: APP_NAME, // Name of the site shown in Open Graph previews on social platforms.
    url: APP_URL, // Canonical URL for the app, used in social media previews.
    title: {
      default: APP_DEFAULT_TITLE, // Default title used in Open Graph meta tags for social previews.
      template: APP_TITLE_TEMPLATE, // Template for title formatting in Open Graph to create page-specific titles.
    },
    description: APP_DESCRIPTION, // Description used in Open Graph for richer social media previews.
    images: { url: TWITTER_OG_IMAGE_URL, width: 1200, height: 630 }, // Default Open Graph image with recommended size.
  },
  twitter: {
    card: "summary_large_image", // Sets Twitter card type to 'summary', showing a small preview image and description. To show big image, use 'summary_large_image'.
    title: {
      default: APP_DEFAULT_TITLE, // Default title used in Twitter metadata for page previews.
      template: APP_TITLE_TEMPLATE, // Template for Twitter title formatting to include specific page names.
    },
    description: APP_DESCRIPTION, // Description displayed in Twitter card previews.
    images: {
      url: TWITTER_OG_IMAGE_URL,
      width: 1200,
      height: 630,
      alt: APP_DESCRIPTION,
    }, // Image used in Twitter preview card with dimensions.
  },
};

export default function Layout({ children }: RootLayoutProps) {
  initLogger();

  return (
    <html lang="en" className={cn("antialiased", Gabarito.className)}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#00000000" />
      </head>
      <body className="antialiased w-screen overflow-x-hidden">
        <Suspense
          fallback={
            <Loading spinnerClassName="absolute top-1/2 left-1/2 h-16 w-16" />
          }
        >
          <ThemeProvider>
            <StoreProvider>
              <SessionWrapper>
                <TopLoaderProvider />
                <AnimationProvider>{children}</AnimationProvider>
                <ClientTrackersProvider />
              </SessionWrapper>
            </StoreProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};
