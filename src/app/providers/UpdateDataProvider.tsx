"use client";

import { useExtension } from "@/lib/hooks/useExtension";
import { Logger } from "@/logger";
import { useEffect, useRef } from "react";

export const UpdateDataProvider = () => {
  const { updateNotesStatistics } = useExtension();
  const loadingUpdate = useRef(false);

  useEffect(() => {
    if (loadingUpdate.current) return;
    loadingUpdate.current = true;
    updateNotesStatistics()
      .then(() => {
        Logger.info("Notes statistics updated");
      })
      .catch(error => {
        Logger.error("Error updating notes statistics", error);
      })
      .finally(() => {
        loadingUpdate.current = false;
      });
  }, [updateNotesStatistics]);

  return null;
};
