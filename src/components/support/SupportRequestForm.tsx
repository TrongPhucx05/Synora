"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { clsx } from "clsx";
import { useSupportRateLimitStatus } from "@/lib/support/hooks";
import { RateLimitNotice } from "./RateLimitNotice";
import { TYPE_LABELS } from "@/lib/support/labels";
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
      setError("Vui lòng nhập đầy đủ tiêu đề và nội dung");
      return;
    }
    if (!isLoggedIn && !contactEmail.trim()) {
      setError("Vui lòng nhập email liên hệ");
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
        setError(data.error ?? "Không thể gửi yêu cầu");
        refreshRateStatus();
        return;
      }
      setResult({ code: data.code });
      refreshRateStatus();
    } catch {
      setError("Không thể gửi yêu cầu, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Yêu cầu của bạn đã được gửi thành công
        </h3>
        <p className="text-xs text-slate-500 mb-1">
          Mã yêu cầu:{" "}
          <span className="font-mono font-semibold text-slate-700">
            {result.code}
          </span>
        </p>
        <p className="text-xs text-slate-500 mb-5">
          Chúng tôi đã gửi email xác nhận đến địa chỉ email của bạn.
        </p>
        <button
          onClick={() => {
            setResult(null);
            setSubject("");
            setMessage("");
          }}
          className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Gửi yêu cầu khác
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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Gửi yêu cầu hỗ trợ
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô tả vấn đề của bạn, đội ngũ hỗ trợ sẽ phản hồi qua email.
          </p>
        </div>
        <RateLimitNotice status={rateStatus} />
      </div>

      <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
        <ShieldAlert size={14} className="mt-0.5 shrink-0 text-slate-400" />
        <span>
          Vui lòng không gửi nhiều yêu cầu liên tiếp hoặc gửi nội dung spam. Mỗi
          yêu cầu cần được mô tả rõ ràng và đầy đủ để đội ngũ hỗ trợ có thể xử
          lý nhanh nhất. Gửi nhiều yêu cầu trùng lặp có thể làm quá trình xử lý
          chậm hơn.
        </span>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1 block">
          Loại yêu cầu
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as SupportRequestType)}
          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {!isLoggedIn && (
        <>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">
              Email liên hệ *
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="ban@example.com"
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">
              Tên của bạn
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </>
      )}

      {isLoggedIn && (
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">
            Email liên hệ
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={session?.user?.email ?? ""}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1 block">
          Tiêu đề
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ví dụ: Không thể tải tài liệu lên"
          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1 block">
          Nội dung
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Mô tả chi tiết vấn đề của bạn..."
          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-[10px] text-slate-400 mt-1 text-right">
          {message.length}/2000
        </p>
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={disabled}
        className={clsx(
          "self-end px-5 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {loading ? "Đang gửi..." : "Gửi yêu cầu"}
      </button>
    </div>
  );
}
