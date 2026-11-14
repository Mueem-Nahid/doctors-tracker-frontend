"use client";

import { useSyncExternalStore } from "react";
import { IconButton } from "@/components/atoms/icon-button";

const themeChangeEvent = "doctor-tracker:theme-change";

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(themeChangeEvent, onChange);
  return () => window.removeEventListener(themeChangeEvent, onChange);
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerThemeSnapshot() {
  return false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme() {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem("dt-theme", nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <IconButton
      icon={isDark ? "sun" : "moon"}
      label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="theme-toggle"
      onClick={toggleTheme}
    />
  );
}
