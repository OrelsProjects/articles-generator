"use client";

import { useAppSelector } from "@/lib/hooks/redux";
import { useExtension } from "@/lib/hooks/useExtension";
import { Logger } from "@/logger";
import { useEffect, useRef } from "react";

export function SubstackCookiesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUserSubstackCookies } = useExtension();
  const { user } = useAppSelector(state => state.auth);
  const loading = useRef(false);

  useEffect(() => {
    if (!user || loading.current) return;
    loading.current = true;
    setUserSubstackCookies()
      .then(() => {
        Logger.info("User substack cookies set");
      })
      .catch(error => {
        Logger.error(
          "Error setting user substack cookies: " + JSON.stringify(error),
        );
      })
      .finally(() => {
        loading.current = false;
      });
  }, [user]);

  return <>{children}</>;
}
