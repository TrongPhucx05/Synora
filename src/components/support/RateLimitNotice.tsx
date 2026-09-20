"use client";
import { AlertTriangle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RateLimitStatusResponse } from "@/lib/support/types";

export function RateLimitNotice({
  status,
}: {
  status: RateLimitStatusResponse | null;
}) {
  const t = useTranslations("support.rateLimit");

  if (!status) return null;

  const formatRetry = (seconds?: number) => {
    if (!seconds) return t("cooldownFallback");
    return t("cooldownMinutes", { minutes: Math.ceil(seconds / 60) });
  };

  if (status.allowed) {
    return (
      <p className="text-xs text-text-muted whitespace-nowrap">
        {t.rich("remaining", {
          remaining: status.remaining,
          limit: status.limit,
          b: (chunks) => (
            <span className="font-semibold text-text-secondary">{chunks}</span>
          ),
        })}
      </p>
    );
  }

  if (status.reason === "COOLDOWN") {
    return (
      <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 border border-amber-100 rounded-lg px-3 py-2">
        <Clock size={14} className="mt-0.5 shrink-0" />
        <span>{t("cooldown", { time: formatRetry(status.retryAfterSeconds) })}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15 border border-red-100 rounded-lg px-3 py-2">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <span>{t("dailyLimit", { limit: status.limit })}</span>
    </div>
  );
}