"use client";

import { setIsFetchingNotesStats } from "@/lib/features/statistics/statisticsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { useExtension } from "@/lib/hooks/useExtension";
import { Logger } from "@/logger";
import { useEffect, useRef, useState } from "react";

export const UpdateDataProvider = () => {
  const dispatch = useAppDispatch();
  const { updateNotesStatistics, verifyExtensionKey } = useExtension();
  const [isExtensionKeyValid, setIsExtensionKeyValid] = useState(false);
  const loadingVerify = useRef(false);
  const loadingUpdate = useRef(false);

  useEffect(() => {
    if (loadingVerify.current) return;
    loadingVerify.current = true;
    verifyExtensionKey()
      .then(result => {
        setIsExtensionKeyValid(result);
      })
      .finally(() => {
        loadingVerify.current = false;
      });
  }, []);

  useEffect(() => {
    if (!isExtensionKeyValid) {
      return;
    }
    if (loadingUpdate.current) return;
    loadingUpdate.current = true;
    debugger;
    dispatch(setIsFetchingNotesStats(true));
    updateNotesStatistics()
      .then(() => {
        Logger.info("Notes statistics updated");
      })
      .catch(error => {
        Logger.error("Error updating notes statistics", error);
      })
      .finally(() => {
        loadingUpdate.current = false;
        dispatch(setIsFetchingNotesStats(false));
      });
  }, [isExtensionKeyValid]);

  return null;
};
