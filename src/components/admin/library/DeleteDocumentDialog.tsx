"use client";
import { useState, useRef, useEffect } from "react";
import { X, Trash2, ChevronDown, Check } from "lucide-react";
import { clsx } from "clsx";
import {
  VIOLATION_REASON_LABELS,
  VIOLATION_REASONS,
  type ViolationReason,
} from "@/lib/admin/moderation";

export function DeleteDocumentDialog({
  documentTitle,
  loading,
  onConfirm,
  onCancel,
}: {
  documentTitle: string;
  loading: boolean;
  onConfirm: (reason: ViolationReason, note: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<ViolationReason | "">("");
  const [note, setNote] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 size={17} className="text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Xóa tài liệu vi phạm
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          "{documentTitle}" sẽ bị xóa vĩnh viễn. Người tải lên sẽ nhận thông báo
          kèm lý do.
        </p>

        <div className="flex flex-col gap-1.5 mb-3 relative" ref={dropdownRef}>
          <label className="text-xs font-semibold text-slate-700">
            Lý do vi phạm <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setDropdownOpen((p) => !p)}
            className={clsx(
              "w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-xl text-sm text-left transition-colors",
              dropdownOpen
                ? "border-blue-400 ring-2 ring-blue-100"
                : "border-slate-200",
              !reason && "text-slate-400",
            )}
          >
            {reason ? VIOLATION_REASON_LABELS[reason] : "Chọn lý do..."}
            <ChevronDown
              size={14}
              className={clsx(
                "text-slate-400 transition-transform shrink-0",
                dropdownOpen && "rotate-180",
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-slate-200 rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto">
              {VIOLATION_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReason(r);
                    setDropdownOpen(false);
                  }}
                  className={clsx(
                    "w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors",
                    reason === r
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {VIOLATION_REASON_LABELS[r]}
                  {reason === r && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Ghi chú thêm (tùy chọn)"
          className="w-full text-sm border border-slate-200 rounded-xl p-3 mb-4 resize-none focus:outline-none focus:border-blue-400"
        />

        <div className="flex gap-2">
          <button
            onClick={() => reason && onConfirm(reason, note.trim())}
            disabled={loading || !reason}
            className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-70"
          >
            {loading ? "Đang xóa..." : "Xóa & gửi thông báo"}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
