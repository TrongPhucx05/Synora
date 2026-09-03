export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "synora-theme";
export const THEME_CACHE_KEY = "theme";

export function isValidTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}