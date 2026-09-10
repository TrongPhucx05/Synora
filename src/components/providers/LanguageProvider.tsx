"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import { useSession } from "next-auth/react";
import {
  getCachedValue,
  setCachedValue,
  subscribe,
} from "@/lib/settings/syncedSetting";
import {
  LOCALE_CACHE_KEY,
  isValidLocale,
  type Locale,
} from "@/lib/i18n/constants";
import { setLocaleCookie } from "@/lib/i18n/cookie";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";

type Messages = Record<string, any>;

const MESSAGES: Record<Locale, Messages> = {
  vi: viMessages,
  en: enMessages,
};

interface LanguageContextValue {
  locale: Locale;
  setLocale: (next: Locale) => Promise<void>;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [locale, setLocaleState] = useState<Locale>(
    () => getCachedValue<Locale>(LOCALE_CACHE_KEY) ?? initialLocale,
  );
  const [loading, setLoading] = useState(true);
  const fetchedForUser = useRef<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    return subscribe<Locale>(LOCALE_CACHE_KEY, setLocaleState);
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

    fetch("/api/settings/language")
      .then((res) => res.json())
      .then((data) => {
        const serverLocale = isValidLocale(data.language)
          ? data.language
          : "vi";
        setCachedValue(LOCALE_CACHE_KEY, serverLocale);
        setLocaleCookie(serverLocale);
        setLocaleState(serverLocale);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, session?.user?.id]);

  const setLocale = useCallback(
    async (next: Locale) => {
      const prev = getCachedValue<Locale>(LOCALE_CACHE_KEY) ?? locale;
      setCachedValue(LOCALE_CACHE_KEY, next);
      setLocaleState(next);
      setLocaleCookie(next);

      if (!isLoggedIn) return;

      try {
        const res = await fetch("/api/settings/language", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: next }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setCachedValue(LOCALE_CACHE_KEY, prev);
        setLocaleState(prev);
        setLocaleCookie(prev);
        throw new Error("Cập nhật thất bại");
      }
    },
    [locale, isLoggedIn],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, loading }}>
      <NextIntlClientProvider
        locale={locale}
        messages={MESSAGES[locale]}
        timeZone="Asia/Ho_Chi_Minh"
      >
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used within <LanguageProvider>");
  return ctx;
}
