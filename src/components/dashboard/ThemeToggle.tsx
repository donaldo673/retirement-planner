"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardIcon } from "./DashboardIcon";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "retirement-planner:theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [storageError, setStorageError] = useState<string | null>(null);
  const preferenceRef = useRef<Theme | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    let preference: string | null = null;
    try {
      preference = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
      console.error("Could not read the saved theme preference.", error);
    }
    preferenceRef.current =
      preference === "light" || preference === "dark" ? preference : null;

    const applyTheme = (nextTheme: Theme) => {
      document.documentElement.dataset.theme = nextTheme;
      setTheme(nextTheme);
    };
    const applyPreference = () => {
      if (preferenceRef.current) {
        applyTheme(preferenceRef.current);
      } else {
        applyTheme(mediaQuery.matches ? "dark" : "light");
      }
    };
    const onSystemThemeChange = () => {
      if (!preferenceRef.current) {
        applyPreference();
      }
    };

    applyPreference();
    mediaQuery.addEventListener("change", onSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", onSystemThemeChange);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    preferenceRef.current = nextTheme;
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
    setStorageError(null);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      setStorageError("Theme changed, but this browser could not save your preference.");
    }
  }

  return (
    <div className="relative">
      <button
        aria-describedby={storageError ? "theme-storage-error" : undefined}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        aria-pressed={theme === "dark"}
        className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        onClick={toggleTheme}
        type="button"
      >
        <DashboardIcon
          className="size-5"
          name={theme === "dark" ? "sun" : "moon"}
        />
      </button>
      {storageError ? (
        <span
          className="absolute right-0 top-full z-30 mt-2 w-56 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 shadow-lg dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
          id="theme-storage-error"
          role="status"
        >
          {storageError}
        </span>
      ) : null}
    </div>
  );
}
