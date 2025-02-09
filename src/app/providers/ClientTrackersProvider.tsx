"use client";

import { initEventTracker, setUserEventTracker } from "@/eventTracker";
import { useAppSelector } from "@/lib/hooks/redux";
import { initLogger, setUserLogger } from "@/logger";
import { useEffect, useState } from "react";

export default function ClientTrackersProvider() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (isInitialized) return;
    initLogger();
    initEventTracker();
    setIsInitialized(true);
  }, [isInitialized]);

  useEffect(() => {
    if (user) {
      setUserEventTracker(user);
      setUserLogger(user);
    }
  }, [user]);

  return null;
}
