"use client";

import { useAppSelector } from "@/lib/hooks/redux";
import { useExtension } from "@/lib/hooks/useExtension";
import { Logger } from "@/logger";
import axios from "axios";
import { useCallback, useEffect, useRef } from "react";

export function SubstackCookiesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUserSubstackCookies } = useExtension();
  const { user } = useAppSelector(state => state.auth);
  const loading = useRef(false);

  // id: 67e51cf33404f6f4769781fe
  const testSendNote = useCallback(async () => {
    if (!user) return;
    const secret = "cvg7DUjZ20+EaNxD+2bW7JgXYza0F05vBdM+tenpzRw=";
    const noteId = "67e51cf33404f6f4769781fe";
    axios.post(
      `/api/user/${user.userId}/notes/${noteId}/send`,
      {},
      {
        headers: {
          "x-substack-schedule-secret": secret,
        },
      },
    );
  }, [user]);

  useEffect(() => {
    if (!user || loading.current) return;
    loading.current = true;
    testSendNote().catch(e => {
      debugger;
    });
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
