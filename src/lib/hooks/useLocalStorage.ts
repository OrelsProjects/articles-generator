import { useState, useEffect } from "react";
import { Logger } from "@/logger";

export type LocalStorageKey =
  | "lastUsedIdea"
  | "features"
  | "referral"
  | "subscription"
  | "last_note"
  | "queue_active_tab"
  | "hide_schedule_alert"
  | "queue_did_see_warning"
  | "queue_did_see_new_system"
  | "did_reset_schedules"
  | "has_extension"
  | "did_show_schedule_instructions"
  | "public_streak_data"
  | "show_welcome_users_radar"
  | "free_post_url"
  | "show_character_count_bar"
  | "premium-feature-soon-overlay"
  | "hide_feedback_fab"
  | "notes_view_mode"
  | "first_time_drafts_tooltip_shown"
  | "create_note_dropdown_opened"
  | "did_create_note"
  | "include_articles_checked"
  | "last_dismissed_discrepancy_bar"
  | "last_selected_client_id"

function useLocalStorage<T>(key: LocalStorageKey, initialValue: T) {
  // Get stored value from localStorage or use initialValue
  const readValue = (): T => {
    if (typeof window === "undefined") return initialValue;

    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? (JSON.parse(storedValue) as T) : initialValue;
    } catch (error) {
      Logger.error(`Error reading localStorage key “${key}”:`, { error: String(error) });
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Save value to localStorage
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      setStoredValue(newValue);
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      Logger.error(`Error setting localStorage key “${key}”:`, { error: String(error) });
    }
  };

  // Update state when localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(
          event.newValue ? (JSON.parse(event.newValue) as T) : initialValue,
        );
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue] as const;
}

export default useLocalStorage;
