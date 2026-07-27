"use client";

import { useState } from "react";
import { AlertTriangle, Bell, Flag } from "lucide-react";
import { clsx } from "clsx";
import {
  VIOLATION_REASONS,
  VIOLATION_REASON_LABELS,
  type ViolationReason,
} from "@/lib/admin/moderation";

export type AdminDeletePayload = {
  reason?: ViolationReason;
  note?: string;
  notifyUser: boolean;
  flagUser: boolean;
};

export function AdminDeletePostDialog({
  loading,
  onConfirm,
  onCancel,
}: {
  loading?: boolean;
  onConfirm: (payload: AdminDeletePayload) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<ViolationReason>("INAPPROPRIATE");
  const [note, setNote] = useState("");
  const [notifyUser, setNotifyUser] = useState(true);
  const [flagUser, setFlagUser] = useState(false);

  const needsReason = notifyUser || flagUser;

  const handleConfirm = () => {
    onConfirm({
      reason: needsReason ? reason : undefined,
      note: note.trim() || undefined,
      notifyUser,
      flagUser,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle size={19} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Xóa bài viết?</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
          </div>
        </div>

        <div className="px-5 flex flex-col gap-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyUser}
              onChange={(e) => setNotifyUser(e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4"
            />
            <span className="text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <Bell size={13} /> Gửi cảnh báo vi phạm cho người dùng
              </span>
              <span className="text-slate-400">
                Người đăng sẽ nhận thông báo lý do bài viết bị gỡ.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={flagUser}
              onChange={(e) => setFlagUser(e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4"
            />
            <span className="text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <Flag size={13} /> Gắn cờ vi phạm vào tài khoản
              </span>
              <span className="text-slate-400">
                Tăng số lần vi phạm, phục vụ theo dõi người dùng tái phạm.
              </span>
            </span>
          </label>

          {needsReason && (
            <div className="mt-1">
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Lý do vi phạm
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ViolationReason)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {VIOLATION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {VIOLATION_REASON_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">
              Ghi chú {needsReason ? "(hiển thị cho người dùng)" : "(nội bộ, không bắt buộc)"}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ví dụ: nội dung chứa thông tin sai lệch về..."
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 mt-3 bg-slate-50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={clsx(
              "px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors",
              loading && "opacity-60 cursor-not-allowed",
            )}
          >
            {loading ? "Đang xóa..." : "Xóa bài viết"}
          </button>
        </div>
      </div>
    </div>
  );
}