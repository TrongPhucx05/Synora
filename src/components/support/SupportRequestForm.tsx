"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { clsx } from "clsx";
import { useSupportRateLimitStatus } from "@/lib/support/hooks";
import { RateLimitNotice } from "./RateLimitNotice";
import { useSupportLabels } from "@/lib/support/labels.client";
import type { SupportRequestType } from "@/lib/support/types";

const TYPE_OPTIONS: SupportRequestType[] = [
  "ACCOUNT_SUPPORT",
  "BUG_REPORT",
  "FEEDBACK",
  "BAN_APPEAL",
  "ACCOUNT_DELETION",
  "OTHER",
];

export function SupportRequestForm() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const t = useTranslations("support.form");
  const { typeLabel } = useSupportLabels();

  const [type, setType] = useState<SupportRequestType>("ACCOUNT_SUPPORT");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code: string } | null>(null);

  const emailForRateCheck = isLoggedIn ? undefined : contactEmail || undefined;
  const { status: rateStatus, refresh: refreshRateStatus } =
    useSupportRateLimitStatus(emailForRateCheck);

  const handleSubmit = async () => {
    setError(null);
    if (!subject.trim() || !message.trim()) {
      setError(t("errors.missingFields"));
      return;
    }
    if (!isLoggedIn && !contactEmail.trim()) {
      setError(t("errors.missingEmail"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/support/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          subject: subject.trim(),
          message: message.trim(),
          contactEmail: contactEmail.trim() || undefined,
          guestName: guestName.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("errors.submitFailed"));
        refreshRateStatus();
        return;
      }
      setResult({ code: data.code });
      refreshRateStatus();
    } catch {
      setError(t("errors.submitFailedRetry"));
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-surface border border-surface-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-sm font-bold text-text-primary mb-1">
          {t("successTitle")}
        </h3>
        <p className="text-xs text-text-muted mb-1">
          {t("successCode")}{" "}
          <span className="font-mono font-semibold text-text-secondary">
            {result.code}
          </span>
        </p>
        <p className="text-xs text-text-muted mb-5">
          {t("successEmailNotice")}
        </p>
        <button
          onClick={() => {
            setResult(null);
            setSubject("");
            setMessage("");
          }}
          className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {t("submitAnother")}
        </button>
      </div>
    );
  }

  const disabled =
    loading ||
    (rateStatus !== null &&
      !rateStatus.allowed &&
      rateStatus.reason === "DAILY_LIMIT");

  return (
    <div className="bg-surface border border-surface-200 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-text-primary">
            {t("title")}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {t("description")}
          </p>
        </div>
        <RateLimitNotice status={rateStatus} />
      </div>

      <div className="flex items-start gap-2 text-xs text-text-muted bg-surface-50 border border-surface-100 rounded-lg px-3 py-2.5">
        <ShieldAlert size={14} className="mt-0.5 shrink-0 text-text-muted" />
        <span>{t("spamNotice")}</span>
      </div>

      <div>
        <label className="text-xs font-medium text-text-secondary mb-1 block">
          {t("typeLabel")}
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as SupportRequestType)}
          className="w-full text-xs border border-surface-200 rounded-lg px-2.5 py-2 bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {typeLabel(opt)}
            </option>
          ))}
        </select>
      </div>

      {!isLoggedIn && (
        <>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">
              {t("emailLabelRequired")}
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full text-xs border border-surface-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">
              {t("nameLabel")}
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full text-xs border border-surface-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </>
      )}

      {isLoggedIn && (
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">
            {t("emailLabel")}
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={session?.user?.email ?? ""}
            className="w-full text-xs border border-surface-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-text-secondary mb-1 block">
          {t("subjectLabel")}
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("subjectPlaceholder")}
          className="w-full text-xs border border-surface-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-text-secondary mb-1 block">
          {t("contentLabel")}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder={t("contentPlaceholder")}
          className="w-full text-xs border border-surface-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-[10px] text-text-muted mt-1 text-right">
          {t("charCount", { count: message.length })}
        </p>
      </div>

      {error && <p className="text-[11px] text-red-500 dark:text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={disabled}
        className={clsx(
          "self-end px-5 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {loading ? t("submitting") : t("submitBtn")}
      </button>
    </div>
  );
}