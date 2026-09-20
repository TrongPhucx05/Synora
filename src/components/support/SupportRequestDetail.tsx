"use client";
import { useTranslations, useLocale } from "next-intl";
import { useSupportLabels } from "@/lib/support/labels.client";
import { StatusBadge } from "./StatusBadge";
import type { TrackedSupportRequest } from "@/lib/support/types";

export function SupportRequestDetail({
  request,
}: {
  request: TrackedSupportRequest;
}) {
  const t = useTranslations("support.detail");
  const { typeLabel } = useSupportLabels();
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "vi-VN";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-text-muted">{t("code")}</p>
          <p className="text-sm font-mono font-semibold text-text-secondary">
            {request.code}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div>
        <p className="text-xs text-text-muted mb-1">{t("type")}</p>
        <p className="text-sm text-text-secondary">{typeLabel(request.type)}</p>
      </div>

      <div>
        <p className="text-xs text-text-muted mb-1">{t("subject")}</p>
        <p className="text-sm font-medium text-text-secondary">{request.subject}</p>
      </div>

      <div>
        <p className="text-xs text-text-muted mb-1">{t("content")}</p>
        <p className="text-sm text-text-secondary bg-surface-50 rounded-lg p-3 whitespace-pre-wrap">
          {request.message}
        </p>
      </div>

      <div className="text-xs text-text-muted">
        {t("sentAt", { date: new Date(request.createdAt).toLocaleString(dateLocale) })}
      </div>

      {request.replies.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-2">{t("history")}</p>
          <div className="flex flex-col gap-3">
            {request.replies.map((r, i) => (
              <div key={i} className="border border-surface-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge status={r.statusAtReply} />
                  <span className="text-[11px] text-text-muted">
                    {new Date(r.createdAt).toLocaleString(dateLocale)}
                  </span>
                </div>
                {r.message && (
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {r.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}