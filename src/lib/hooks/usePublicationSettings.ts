import { useState, useEffect } from "react";
import axios from "axios";
import { useSettings } from "./useSettings";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  selectSettings,
  setGeneratingDescription,
} from "@/lib/features/settings/settingsSlice";

export interface PublicationSettings {
  preferredTopics: string[];
  personalDescription: string;
  userSettingsUpdatedAt: Date | null;
  generatedDescription: string;
  generatedTopics: string;
}

export const usePublicationSettings = () => {
  const dispatch = useAppDispatch();
  const [publicationSettings, setPublicationSettings] =
    useState<PublicationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasPublication } = useSettings();
  const { settings } = useAppSelector(selectSettings);

  const fetchSettings = async () => {
    if (!hasPublication) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("/api/user/publication-settings");
      setPublicationSettings(response.data.settings);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to fetch publication settings",
      );
      console.error("Error fetching publication settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (
    updatedSettings: Partial<PublicationSettings>,
  ) => {
    if (!hasPublication) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "/api/user/publication-settings",
        updatedSettings,
      );
      setPublicationSettings(prev =>
        prev ? { ...prev, ...response.data.settings } : response.data.settings,
      );
      return response.data.settings;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Failed to update publication settings";
      setError(errorMessage);
      console.error("Error updating publication settings:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshPublicationData = async () => {
    if (!hasPublication) throw new Error("No publication found");
    if (settings.generatingDescription) return;
    dispatch(setGeneratingDescription(true));
    try {
      await axios.post("/api/user/analyze");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to refresh publication data",
      );
      console.error("Error refreshing publication data:", err);
      dispatch(setGeneratingDescription(false));
      throw err;
    }
  };

  useEffect(() => {
    if (hasPublication) {
      fetchSettings();
    }
  }, [hasPublication]);

  return {
    publicationSettings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    hasPublication,
    refreshPublicationData,
  };
};
