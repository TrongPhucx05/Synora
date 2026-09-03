"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import type { SupportRequestType } from "@/lib/support/types";

export function SupportRequestModal({
  defaultSubject,
  type = "BAN_APPEAL",
  onClose,
}: {
  defaultSubject?: string;
  type?: SupportRequestType;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/support/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Không thể gửi yêu cầu");
      setCode(data.code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể gửi yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {code ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-text-primary mb-1">
              Đã gửi yêu cầu hỗ trợ
            </h3>
            <p className="text-xs text-text-muted mb-1">
              Mã yêu cầu:{" "}
              <span className="font-mono font-semibold text-text-secondary">
                {code}
              </span>
            </p>
            <p className="text-xs text-text-muted mb-5">
              Quản trị viên sẽ xem xét và phản hồi qua email trong thời gian sớm
              nhất.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Đóng
            </button>
          </div>
        ) : (
          <>
            <div className="relative px-5 pt-5 pb-4 text-center">
              <h3 className="text-sm font-bold text-text-primary">
                Yêu cầu hỗ trợ
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Trình bày vấn đề để quản trị viên xem xét yêu cầu của bạn.
              </p>
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-1.5 hover:bg-surface-100 rounded-lg transition-colors text-text-muted"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ví dụ: Khiếu nại về việc khóa tài khoản"
                  className="w-full text-xs border border-surface-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">
                  Nội dung
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Mô tả chi tiết lý do bạn muốn khiếu nại..."
                  className="w-full text-xs border border-surface-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-[10px] text-text-muted mt-1 text-right">
                  {message.length}/2000
                </p>
              </div>

              {error && (
                <p className="text-[11px] text-red-500 -mt-1">{error}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 mt-2 bg-surface-50">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-medium text-text-secondary rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={clsx(
                  "px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity",
                  loading && "opacity-60 cursor-not-allowed",
                )}
              >
                {loading ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
