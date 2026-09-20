"use client";
import { X, Send } from "lucide-react";
import { useState } from "react";
import { AdminStatusBadge } from "@/components/support/AdminStatusBadge";
import { STATUS_LABELS, TYPE_LABELS } from "@/lib/support/labels";
import type {
  AdminSupportRequestRow,
  SupportRequestStatus,
} from "@/lib/support/types";

const TERMINAL_STATUSES: SupportRequestStatus[] = [
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];
const STATUS_OPTIONS: SupportRequestStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];

export function SupportRequestDetailModal({
  request,
  onClose,
  onUpdate,
}: {
  request: AdminSupportRequestRow;
  onClose: () => void;
  onUpdate: (status: SupportRequestStatus, reply: string) => void;
}) {
  const [status, setStatus] = useState<SupportRequestStatus>(
    request.status === "PENDING" ? "IN_PROGRESS" : request.status,
  );
  const [reply, setReply] = useState("");
  const isTerminal = TERMINAL_STATUSES.includes(request.status);

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/25 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-[560px] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="text-base font-semibold text-text-primary">
            Chi tiết yêu cầu hỗ trợ
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-100 text-text-muted"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-text-muted">Mã yêu cầu</p>
              <p className="text-sm font-mono font-semibold text-text-secondary">
                {request.code}
              </p>
            </div>
            <AdminStatusBadge status={request.status} />
          </div>

          <div>
            <p className="text-xs text-text-muted mb-1">Người gửi</p>
            {request.user ? (
              <>
                <p className="text-sm font-medium text-text-secondary">
                  {request.user.name}
                </p>
                <p className="text-xs text-text-muted">
                  @{request.user.username}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-text-secondary">
                {request.guestName || "Khách (chưa đăng nhập)"}
              </p>
            )}
            <p className="text-xs text-text-muted mt-0.5">
              {request.contactEmail}
            </p>
          </div>

          <div>
            <p className="text-xs text-text-muted mb-1">Loại yêu cầu</p>
            <p className="text-sm text-text-secondary">
              {TYPE_LABELS[request.type]}
            </p>
          </div>

          <div>
            <p className="text-xs text-text-muted mb-1">Tiêu đề</p>
            <p className="text-sm font-medium text-text-secondary">
              {request.subject}
            </p>
          </div>

          <div>
            <p className="text-xs text-text-muted mb-1">Nội dung</p>
            <p className="text-sm text-text-secondary bg-surface-50 rounded-lg p-3 whitespace-pre-wrap">
              {request.message}
            </p>
          </div>

          {!isTerminal ? (
            <>
              <div>
                <p className="text-xs text-text-muted mb-1">
                  Cập nhật trạng thái
                </p>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as SupportRequestStatus)
                  }
                  className="w-full text-sm border border-surface-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">
                  Phản hồi cho người dùng (sẽ gửi qua email)
                </p>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  placeholder="Vd: Chúng tôi đã xem xét và..."
                  className="w-full text-sm border border-surface-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
            </>
          ) : (
            <div className="text-xs text-text-muted">
              Đã kết thúc lúc{" "}
              {request.resolvedAt
                ? new Date(request.resolvedAt).toLocaleString("vi-VN")
                : "—"}
            </div>
          )}
        </div>

        {!isTerminal && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-surface-100">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-100"
            >
              Đóng
            </button>
            <button
              onClick={() => onUpdate(status, reply)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600"
            >
              Gửi phản hồi & Cập nhật
            </button>
          </div>
        )}
      </div>
    </div>
  );
}