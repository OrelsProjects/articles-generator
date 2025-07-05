"use client";

import { setIsFetchingNotesStats } from "@/lib/features/statistics/statisticsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { useExtension } from "@/lib/hooks/useExtension";
import { Logger } from "@/logger";
import { useEffect, useRef, useState } from "react";

export const UpdateDataProvider = () => {
  const dispatch = useAppDispatch();
  const {
    updateNotesStatistics,
    verifyExtensionKey,
    updateExtensionData,
    updateNotesData,
  } = useExtension();
  const [isExtensionKeyValid, setIsExtensionKeyValid] = useState(false);
  const loadingVerify = useRef(false);
  const loadingUpdate = useRef(false);
  const loadingUpdateExtensionData = useRef(false);
  const loadingUpdateNoteData = useRef(false);

  useEffect(() => {
    if (loadingVerify.current) return;
    loadingVerify.current = true;
    verifyExtensionKey()
      .then(result => {
        setIsExtensionKeyValid(result);
      })
      .catch(() => {
        // do nothing
      })
      .finally(() => {
        loadingVerify.current = false;
      });
  }, []);

  useEffect(() => {
    if (loadingUpdateExtensionData.current) return;
    loadingUpdateExtensionData.current = true;
    updateExtensionData()
      .catch(() => {
        // do nothing
      })
      .finally(() => {
        loadingUpdateExtensionData.current = false;
      });
  }, []);

  useEffect(() => {
    if (!isExtensionKeyValid) {
      return;
    }
    if (loadingUpdate.current) return;
    loadingUpdate.current = true;

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

  useEffect(() => {
    console.log("Notes data updated starting");
    Logger.info("Notes data updated starting");
    updateNotesData()
      .then(() => {
        console.log("Notes data updated done");
          Logger.info("Notes data updated done");
      })
      .catch(error => {
        console.log("Error updating notes data", error);
        Logger.error("Error updating notes data", error);
      })
      .finally(() => {
        loadingUpdateNoteData.current = false;
      });
  }, []);

  return null;
};
