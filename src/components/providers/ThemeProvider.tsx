"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import {
  getCachedValue,
  setCachedValue,
  subscribe,
} from "@/lib/settings/syncedSetting";
import {
  THEME_CACHE_KEY,
  THEME_STORAGE_KEY,
  isValidTheme,
  resolveSystemTheme,
  type Theme,
} from "@/lib/theme/constants";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (next: Theme) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isValidTheme(stored) ? stored : "system";
}

function applyThemeClass(theme: Theme): "light" | "dark" {
  const resolved = theme === "system" ? resolveSystemTheme() : theme;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [theme, setThemeState] = useState<Theme>(
    () => getCachedValue<Theme>(THEME_CACHE_KEY) ?? readInitialTheme(),
  );
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const fetchedForUser = useRef<string | null>(null);

  useEffect(() => {
    setResolvedTheme(applyThemeClass(theme));
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(applyThemeClass("system"));
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    return subscribe<Theme>(THEME_CACHE_KEY, setThemeState);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !session?.user?.id) {
      setLoading(false);
      return;
    }
    if (fetchedForUser.current === session.user.id) {
      setLoading(false);
      return;
    }
    fetchedForUser.current = session.user.id;

    fetch("/api/settings/theme")
      .then((res) => res.json())
      .then((data) => {
        const serverTheme = isValidTheme(data.theme) ? data.theme : "system";
        setCachedValue(THEME_CACHE_KEY, serverTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, serverTheme);
        setThemeState(serverTheme);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, session?.user?.id]);

  const setTheme = useCallback(
    async (next: Theme) => {
      const prev = getCachedValue<Theme>(THEME_CACHE_KEY) ?? theme;
      setCachedValue(THEME_CACHE_KEY, next);
      setThemeState(next);
      window.localStorage.setItem(THEME_STORAGE_KEY, next);

      if (!isLoggedIn) return;

      try {
        const res = await fetch("/api/settings/theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: next }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setCachedValue(THEME_CACHE_KEY, prev);
        setThemeState(prev);
        window.localStorage.setItem(THEME_STORAGE_KEY, prev);
        throw new Error("Cập nhật thất bại");
      }
    },
    [theme, isLoggedIn],
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}