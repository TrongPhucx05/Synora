"use client";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { Theme } from "@/lib/theme/constants";
import type { Locale } from "@/lib/i18n/constants";

export function AppearanceSection() {
  const { theme, setTheme, loading: themeLoading } = useTheme();
  const { locale, setLocale, loading: localeLoading } = useLanguage();
  const { showToast } = useToast();
  const t = useTranslations("settings");

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("theme.light"), icon: Sun },
    { value: "dark", label: t("theme.dark"), icon: Moon },
    { value: "system", label: t("theme.system"), icon: Monitor },
  ];

  const languageOptions: { value: Locale; label: string; flag: string }[] = [
    { value: "vi", label: t("language.vi"), flag: "🇻🇳" },
    { value: "en", label: t("language.en"), flag: "🇬🇧" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        title={t("theme.title")}
        description={t("theme.description")}
      >
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                disabled={themeLoading}
                onClick={() => {
                  setTheme(opt.value).catch(() =>
                    showToast(t("theme.updateError"), "error"),
                  );
                }}
                className={clsx(
                  "relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-colors disabled:opacity-50",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-surface-200 hover:bg-surface-50",
                )}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
                <div
                  className={clsx(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    isActive
                      ? "bg-primary text-white"
                      : "bg-surface-100 text-text-muted",
                  )}
                >
                  <Icon size={16} />
                </div>
                <p
                  className={clsx(
                    "text-xs font-semibold",
                    isActive ? "text-primary" : "text-text-secondary",
                  )}
                >
                  {opt.label}
                </p>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("language.title")}
        description={t("language.description")}
      >
        <div className="flex flex-col gap-2">
          {languageOptions.map((opt) => (
            <button
              key={opt.value}
              disabled={localeLoading}
              onClick={() => {
                setLocale(opt.value).catch(() =>
                  showToast(t("language.updateError"), "error"),
                );
              }}
              className={clsx(
                "flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors disabled:opacity-50",
                locale === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-surface-200 hover:bg-surface-50",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{opt.flag}</span>
                <p className="text-sm font-medium text-text-primary">
                  {opt.label}
                </p>
              </div>
              {locale === opt.value && (
                <Check size={15} className="text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
}
