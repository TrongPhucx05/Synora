"use client";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useState } from "react";
import { SettingsCard } from "./SettingsCard";
import { clsx } from "clsx";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useToast } from "@/components/ui/Toast";
import type { Theme } from "@/lib/theme/constants";

type Language = "vi" | "en";

export function AppearanceSection() {
  const { theme, setTheme, loading } = useTheme();
  const { showToast } = useToast();
  const [language, setLanguage] = useState<Language>("vi");

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Sáng", icon: Sun },
    { value: "dark", label: "Tối", icon: Moon },
    { value: "system", label: "Theo hệ thống", icon: Monitor },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard title="Theme" description="Tùy chỉnh giao diện sáng/tối theo sở thích">
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                disabled={loading}
                onClick={() => {
                  setTheme(opt.value).catch(() =>
                    showToast("Không thể cập nhật giao diện", "error"),
                  );
                }}
                className={clsx(
                  "relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-colors disabled:opacity-50",
                  isActive ? "border-primary bg-primary/5" : "border-surface-200 hover:bg-surface-50",
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
                    isActive ? "bg-primary text-white" : "bg-surface-100 text-text-muted",
                  )}
                >
                  <Icon size={16} />
                </div>
                <p className={clsx("text-xs font-semibold", isActive ? "text-primary" : "text-text-secondary")}>
                  {opt.label}
                </p>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Ngôn ngữ" description="Chọn ngôn ngữ hiển thị cho toàn bộ ứng dụng">
        <div className="flex flex-col gap-2">
          {[
            { value: "vi" as Language, label: "Tiếng Việt", flag: "🇻🇳" },
            { value: "en" as Language, label: "English", flag: "🇬🇧" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLanguage(opt.value)}
              className={clsx(
                "flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors",
                language === opt.value ? "border-primary bg-primary/5" : "border-surface-200 hover:bg-surface-50",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{opt.flag}</span>
                <p className="text-sm font-medium text-text-primary">{opt.label}</p>
              </div>
              {language === opt.value && <Check size={15} className="text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
}