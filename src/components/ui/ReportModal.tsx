"use client";
import { useState } from "react";
import { X, Flag } from "lucide-react";
import { clsx } from "clsx";
import {
  REASON_LABELS,
  type ReportReasonKey,
  type ReportTargetType,
} from "@/lib/reports/types";
import { submitReport } from "@/lib/reports/utils";
import { useToast } from "@/components/ui/Toast";

export function ReportModal({
  targetType,
  targetId,
  title = "Báo cáo nội dung",
  onClose,
}: {
  targetType: ReportTargetType;
  targetId: string;
  title?: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [reason, setReason] = useState<ReportReasonKey | null>(null);
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      setError("Vui lòng chọn lý do báo cáo");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitReport(targetType, targetId, reason, detail);
      showToast("Đã gửi báo cáo, cảm ơn bạn", "success");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể gửi báo cáo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <Flag size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{title}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Cảm ơn bạn đã giúp cộng đồng an toàn hơn.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          {(Object.entries(REASON_LABELS) as [ReportReasonKey, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setReason(key)}
                className={clsx(
                  "text-left px-3 py-2 rounded-xl text-sm border transition-colors",
                  reason === key
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-surface-200 text-text-secondary hover:bg-surface-50",
                )}
              >
                {label}
              </button>
            ),
          )}
        </div>

        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          placeholder="Mô tả thêm (không bắt buộc)"
          className="w-full mt-3 text-sm border border-surface-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-100"
        />

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-orange-500 text-sm text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Báo cáo"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 rounded-xl border border-surface-200 text-sm text-text-secondary hover:bg-surface-50 transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
