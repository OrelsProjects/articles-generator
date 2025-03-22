import { useState, useEffect } from "react";

export type LocalStorageKey =
  | "lastUsedIdea"
  | "features"
  | "referral"
  | "subscription";

function useLocalStorage<T>(key: LocalStorageKey, initialValue: T) {
  // Get stored value from localStorage or use initialValue
  const readValue = (): T => {
    if (typeof window === "undefined") return initialValue;

    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? (JSON.parse(storedValue) as T) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
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
      console.error(`Error setting localStorage key “${key}”:`, error);
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
