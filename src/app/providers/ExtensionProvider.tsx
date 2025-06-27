"use client";

import {
  setShowExtensionDialog,
  setShowExtensionDisabledDialog,
  setShowNoSubstackCookiesDialog,
} from "@/lib/features/ui/uiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { useState } from "react";

import { useEffect } from "react";
import { useExtension } from "@/lib/hooks/useExtension";
import NoSubstackCookiesDialog from "@/components/notes/no-substack-cookies-dialog";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { Logger } from "@/logger";
import { ExtensionInstallDialog } from "@/components/notes/extension-install-dialog";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { usePathname } from "next/navigation";

export function ExtensionProvider() {
  const router = useCustomRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const [, setExtensionAvailable] = useLocalStorage<{
    version: string;
    date: number;
  } | null>("has_extension", null);
  const {
    showExtensionDialog,
    showNoSubstackCookiesDialog,
    showExtensionDisabledDialog,
  } = useAppSelector(state => state.ui);
  const [showExtensionDialogState, setShowExtensionDialogState] =
    useState(showExtensionDialog);
  const [
    showNoSubstackCookiesDialogState,
    setShowNoSubstackCookiesDialogState,
  ] = useState(showNoSubstackCookiesDialog);
  const [, setShowExtensionDisabledDialogState] = useState(
    showExtensionDisabledDialog,
  );
  const [loading, setLoading] = useState(false);
  const { hasExtension, setUserSubstackCookies, verifyExtension } =
    useExtension();

  const { selectedNote } = useAppSelector(state => state.notes);

  useEffect(() => {
    verifyExtension().then(extensionDetails => {
      Logger.info("Extension details", {
        extensionDetails,
        user: {
          name: user?.displayName,
          id: user?.userId,
        },
      });
      if (extensionDetails.message === "success" && extensionDetails.version) {
        setExtensionAvailable({
          version: extensionDetails.version,
          date: extensionDetails.date || Date.now(),
        });
      } else {
        // No extension available, update local storage
        setExtensionAvailable(null);
      }
    });
  }, []);

  useEffect(() => {
    if (showExtensionDialog) {
      dispatch(setShowExtensionDialog(false));
      setShowExtensionDialogState(true);
    }
  }, [showExtensionDialog]);

  useEffect(() => {
    if (showNoSubstackCookiesDialog) {
      dispatch(setShowNoSubstackCookiesDialog(false));
      setShowNoSubstackCookiesDialogState(true);
    }
  }, [showNoSubstackCookiesDialog]);

  useEffect(() => {
    if (showExtensionDisabledDialog) {
      dispatch(setShowExtensionDisabledDialog(false));
      setShowExtensionDisabledDialogState(true);
    }
  }, [showExtensionDisabledDialog]);

  const handleRefresh = async () => {
    setLoading(true);
    let url = pathname;
    const paramsToAdd: Record<string, string> = {};
    if (selectedNote?.id) {
      paramsToAdd.noteId = selectedNote.id;
    }
    router.push(url, { paramsToAdd, forceRefresh: true });
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  return (
    <>
      <ExtensionInstallDialog
        open={showExtensionDialogState}
        onOpenChange={setShowExtensionDialogState}
        onInstall={() => {}}
        onRefresh={handleRefresh}
        loading={loading}
        selectedNoteId={selectedNote?.id}
      />
      <NoSubstackCookiesDialog
        open={showNoSubstackCookiesDialogState}
        onOpenChange={setShowNoSubstackCookiesDialogState}
        onCancel={() => {
          setShowNoSubstackCookiesDialogState(false);
        }}
        loading={loading}
      />
      {/* <ExtensionDisabledDialog
        open={showExtensionDisabledDialogState}
        onOpenChange={setShowExtensionDisabledDialogState}
        onRefresh={handleRefresh}
      /> */}
    </>
  );
}
