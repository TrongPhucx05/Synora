"use client";
import { X, Bell, Flag, FileQuestion } from "lucide-react";
import { clsx } from "clsx";
import Avatar from "@/components/ui/Avatar";
import {
  ACTION_ICON,
  ACTION_LABELS,
  ACTION_BADGE,
  type AuditLogEntry,
} from "@/lib/audit-log/types";

export function AuditLogDetailModal({
  entry,
  onClose,
}: {
  entry: AuditLogEntry;
  onClose: () => void;
}) {
  const Icon = ACTION_ICON[entry.action] ?? FileQuestion;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="text-sm font-semibold text-text-primary">
            Chi tiết nhật ký
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-100 text-text-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <Avatar
              src={entry.actor.avatarUrl ?? undefined}
              initials={entry.actor.name.slice(0, 2).toUpperCase()}
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {entry.actor.name}
              </p>
              <p className="text-xs text-text-muted truncate">
                {entry.actor.username ? `@${entry.actor.username} · ` : ""}Quản
                trị viên
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-surface-50 rounded-xl px-3.5 py-3">
              <p className="text-[11px] font-medium text-text-muted mb-1">
                Thao tác
              </p>
              <span
                className={clsx(
                  "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  ACTION_BADGE[entry.action] ?? "bg-surface-50 text-text-secondary",
                )}
              >
                <Icon size={11} />
                {ACTION_LABELS[entry.action] ?? entry.action}
              </span>
            </div>

            <div className="bg-surface-50 rounded-xl px-3.5 py-3">
              <p className="text-[11px] font-medium text-text-muted mb-1">
                Đối tượng tác động
              </p>
              <p className="text-xs text-text-secondary">{entry.targetLabel}</p>
            </div>

            {entry.reasonLabel && (
              <div className="bg-surface-50 rounded-xl px-3.5 py-3">
                <p className="text-[11px] font-medium text-text-muted mb-1">
                  Lý do vi phạm
                </p>
                <p className="text-xs text-text-secondary">{entry.reasonLabel}</p>
              </div>
            )}

            {entry.detail && (
              <div className="bg-surface-50 rounded-xl px-3.5 py-3">
                <p className="text-[11px] font-medium text-text-muted mb-1">
                  Chi tiết
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {entry.detail}
                </p>
              </div>
            )}

            {entry.suspendedUntil && (
              <div className="bg-surface-50 rounded-xl px-3.5 py-3">
                <p className="text-[11px] font-medium text-text-muted mb-1">
                  Mở khóa lúc
                </p>
                <p className="text-xs text-text-secondary">{entry.suspendedUntil}</p>
              </div>
            )}

            {(entry.notifiedUser || entry.flaggedUser) && (
              <div className="flex gap-2 flex-wrap">
                {entry.notifiedUser && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <Bell size={11} /> Đã thông báo người dùng
                  </span>
                )}
                {entry.flaggedUser && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <Flag size={11} /> Đã ghi nhận vi phạm
                  </span>
                )}
              </div>
            )}

            <div className="bg-surface-50 rounded-xl px-3.5 py-3">
              <p className="text-[11px] font-medium text-text-muted mb-1">
                Thời gian
              </p>
              <p className="text-xs text-text-secondary">{entry.createdAt}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
