import { ExtensionInstallDialog } from "@/components/notes/extension-install-dialog";
import {
  setShowExtensionDialog,
  setShowNoSubstackCookiesDialog,
} from "@/lib/features/ui/uiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { useState } from "react";

import { useEffect } from "react";
import { useExtension } from "@/lib/hooks/useExtension";
import NoSubstackCookiesDialog from "@/components/notes/no-substack-cookies-dialog";

export function ExtensionProvider() {
  const dispatch = useAppDispatch();
  const { showExtensionDialog, showNoSubstackCookiesDialog } = useAppSelector(
    state => state.ui,
  );
  const [showExtensionDialogState, setShowExtensionDialogState] =
    useState(showExtensionDialog);
  const [
    showNoSubstackCookiesDialogState,
    setShowNoSubstackCookiesDialogState,
  ] = useState(showNoSubstackCookiesDialog);
  const [loading, setLoading] = useState(false);
  const { hasExtension, setUserSubstackCookies } = useExtension();

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

  const handleRefresh = async () => {
    setLoading(true);
    window.location.reload();
    try {
      const has = await hasExtension();
      if (!has) {
        return;
      }
      await setUserSubstackCookies();
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  return (
    <>
      <ExtensionInstallDialog
        open={showExtensionDialogState}
        onOpenChange={setShowExtensionDialogState}
        onInstall={() => {}}
        onRefresh={handleRefresh}
        loading={loading}
      />
      <NoSubstackCookiesDialog
        open={showNoSubstackCookiesDialogState}
        onOpenChange={setShowNoSubstackCookiesDialogState}
        onCancel={() => {
          setShowNoSubstackCookiesDialogState(false);
        }}
        loading={loading}
      />
    </>
  );
}
