"use client";
import { AlertTriangle, Clock } from "lucide-react";
import type { RateLimitStatusResponse } from "@/lib/support/types";

function formatRetry(seconds?: number) {
  if (!seconds) return "một chút";
  return `khoảng ${Math.ceil(seconds / 60)} phút`;
}

export function RateLimitNotice({
  status,
}: {
  status: RateLimitStatusResponse | null;
}) {
  if (!status) return null;

  if (status.allowed) {
    return (
      <p className="text-xs text-slate-500 whitespace-nowrap">
        Bạn còn{" "}
        <span className="font-semibold text-slate-700">
          {status.remaining}/{status.limit}
        </span>{" "}
        lượt trong 7 ngày
      </p>
    );
  }

  if (status.reason === "COOLDOWN") {
    return (
      <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        <Clock size={14} className="mt-0.5 shrink-0" />
        <span>
          Bạn vừa gửi một yêu cầu. Vui lòng đợi{" "}
          {formatRetry(status.retryAfterSeconds)} trước khi gửi yêu cầu tiếp
          theo.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <span>
        Bạn đã sử dụng hết {status.limit} lượt yêu cầu trong 7 ngày. Vui lòng
        quay lại sau.
      </span>
    </div>
  );
}
