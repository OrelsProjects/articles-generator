"use client";

import posthog from "posthog-js";
import mixpanel from "mixpanel-browser";
import { Logger } from "@/logger";
import AppUser from "@/types/appUser";

enum TimeoutLength {
  SHORT = 100,
  MEDIUM = 5000,
  LONG = 10000,
}

interface Dict {
  [key: string]: any;
}

export const setUserEventTracker = (user?: AppUser | null) => {
  try {
    posthog.identify(user?.userId);
    mixpanel.identify(user?.userId);
  } catch (error: any) {
    Logger.error("Error setting user for event tracker", {
      data: {
        user,
      },
      error,
    });
  }
};

export const initEventTracker = () => {
  try {
    const env = process.env.NODE_ENV;
    const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
    const mixpanelToken = process.env.NEXT_PUBLIC_EVENT_TRACKER_TOKEN;
    posthog.init(posthogApiKey || "", {
      debug: env !== "production",
      api_host: "https://app.posthog.com",
      disable_session_recording: env !== "production",
    });
    mixpanel.init(mixpanelToken || "", {
      debug: env !== "production",
      track_pageview: true,
      persistence: "localStorage",
      record_sessions_percent: 100,
    });
  } catch (error: any) {
    Logger.error("Error initializing event tracker", {
      error,
    });
  }
};

const timeoutEvent = (eventName: string, timeout: TimeoutLength) => {
  const lastEvent = localStorage.getItem(eventName);
  const now = new Date().getTime();
  if (lastEvent && now - parseInt(lastEvent) < timeout) {
    return true;
  }
  localStorage.setItem(eventName, now.toString());
  return false;
};

export class EventTracker {
  /**
   *  Track event with props
   * @param eventName is the name of the event
   * @param props is the object with the properties
   * @param timeout how long to wait before sending the same event again
   */
  static track(eventName: string, props?: Dict, timeout?: TimeoutLength) {
    try {
      if (timeout && timeoutEvent(eventName, timeout)) {
        return;
      }
      // if (process.env.NODE_ENV !== "production") {
      //   console.log("Tracking event", eventName, props ?? "");
      //   return;
      // }
      mixpanel.track(eventName, props);
      posthog.capture(eventName, props);
    } catch (error: any) {
      Logger.error("Error tracking event", {
        data: {
          eventName,
          props,
          timeout,
        },
        error,
      });
    }
  }
}
