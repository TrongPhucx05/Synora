"use client";
import { Sun, Moon, Monitor } from "lucide-react";
import { clsx } from "clsx";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useToast } from "@/components/ui/Toast";
import type { Theme } from "@/lib/theme/constants";

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Sáng" },
  { value: "dark", icon: Moon, label: "Tối" },
  { value: "system", icon: Monitor, label: "Theo hệ thống" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, loading } = useTheme();
  const { showToast } = useToast();

  return (
    <div
      className={clsx(
        "flex items-center gap-0.5 bg-surface-100 rounded-full p-1 shrink-0",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            disabled={loading}
            onClick={() => {
              setTheme(opt.value).catch(() =>
                showToast("Không thể cập nhật giao diện", "error"),
              );
            }}
            className={clsx(
              "w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-50",
              active
                ? "bg-surface text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
