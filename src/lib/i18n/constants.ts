export type Locale = "vi" | "en";

export const LOCALE_COOKIE_KEY = "synora-locale";
export const LOCALE_CACHE_KEY = "locale";
export const WAS_AUTH_KEY = "synora-was-auth";

export function isValidLocale(value: unknown): value is Locale {
  return value === "vi" || value === "en";
}