"use client";

import { useState } from "react";
import { AlertTriangle, Ban, Clock } from "lucide-react";
import { clsx } from "clsx";
import {
  LOCK_REASONS,
  LOCK_REASON_LABELS,
  SUSPEND_DURATION_PRESETS,
  type LockReason,
} from "@/lib/admin/account-lock";

export type LockPayload = {
  type: "SUSPEND" | "BAN";
  reason: LockReason;
  note?: string;
  suspendedUntil?: string;
  notifyUser: boolean;
};

export function LockUserModal({
  userName,
  loading,
  onConfirm,
  onCancel,
}: {
  userName: string;
  loading?: boolean;
  onConfirm: (payload: LockPayload) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<"SUSPEND" | "BAN">("SUSPEND");
  const [reason, setReason] = useState<LockReason>("INAPPROPRIATE");
  const [note, setNote] = useState("");
  const [notifyUser, setNotifyUser] = useState(true);
  const [customDate, setCustomDate] = useState("");
  const [presetHours, setPresetHours] = useState<number | null>(24);

  const getSuspendedUntilISO = (): string | undefined => {
    if (presetHours) return new Date(Date.now() + presetHours * 3600_000).toISOString();
    if (customDate) return new Date(customDate).toISOString();
    return undefined;
  };

  const disabled = loading || (type === "SUSPEND" && !getSuspendedUntilISO());

  const handleConfirm = () => {
    const suspendedUntil = type === "SUSPEND" ? getSuspendedUntilISO() : undefined;
    if (type === "SUSPEND" && !suspendedUntil) return;
    onConfirm({ type, reason, note: note.trim() || undefined, suspendedUntil, notifyUser });
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle size={19} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Khóa tài khoản {userName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn hình thức khóa và lý do vi phạm.
            </p>
          </div>
        </div>

        <div className="px-5 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setType("SUSPEND")}
              className={clsx(
                "flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors",
                type === "SUSPEND"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50",
              )}
            >
              <Clock size={14} /> Tạm khóa
            </button>
            <button
              onClick={() => setType("BAN")}
              className={clsx(
                "flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors",
                type === "BAN"
                  ? "border-red-300 bg-red-50 text-red-600"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50",
              )}
            >
              <Ban size={14} /> Vĩnh viễn
            </button>
          </div>

          {type === "SUSPEND" && (
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                Thời gian khóa
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SUSPEND_DURATION_PRESETS.map((p) => (
                  <button
                    key={p.hours}
                    onClick={() => {
                      setPresetHours(p.hours);
                      setCustomDate("");
                    }}
                    className={clsx(
                      "px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-colors",
                      presetHours === p.hours
                        ? "bg-primary text-white border-primary"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <label className="text-[11px] text-slate-400 mb-1 block">
                Hoặc chọn thời điểm mở khóa cụ thể
              </label>
              <input
                type="datetime-local"
                value={customDate}
                min={new Date(Date.now() + 3600_000).toISOString().slice(0, 16)}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setPresetHours(null);
                }}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">
              Lý do vi phạm
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as LockReason)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {LOCK_REASONS.map((r) => (
                <option key={r} value={r}>
                  {LOCK_REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">
              Ghi chú (hiển thị cho người dùng)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ví dụ: bạn đã đăng nhiều tài liệu trùng lặp trong thời gian ngắn"
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer pb-1">
            <input
              type="checkbox"
              checked={notifyUser}
              onChange={(e) => setNotifyUser(e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4"
            />
            <span className="text-xs text-slate-600">
              Gửi thông báo lý do khóa cho người dùng
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 mt-1 bg-slate-50 shrink-0">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={disabled}
            className={clsx(
              "px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            {loading ? "Đang xử lý..." : "Xác nhận khóa"}
          </button>
        </div>
      </div>
    </div>
  );
}