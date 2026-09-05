"use client";
import { X, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { REASON_LABELS, type AdminReportRow } from "@/lib/reports/types";

const TARGET_LINKS: Record<AdminReportRow["targetType"], string> = {
  USER: "/admin/users",
  POST: "/admin/content?tab=posts",
  COMMENT: "/admin/content?tab=comments",
  MESSAGE: "/admin/conversations",
  DOCUMENT: "/admin/library",
  GROUP: "/admin/groups",
};

const TARGET_LINK_LABELS: Record<AdminReportRow["targetType"], string> = {
  USER: "Xem hồ sơ trong Quản lý người dùng",
  POST: "Xem bài viết trong Quản lý nội dung",
  COMMENT: "Xem bình luận trong Quản lý nội dung",
  MESSAGE: "Xem đoạn chat liên quan",
  DOCUMENT: "Xem tài liệu trong Quản lý tài liệu",
  GROUP: "Xem nhóm trong Quản lý nhóm chat",
};

export function ReportDetailModal({
  report,
  onClose,
  onResolve,
  onDismiss,
}: {
  report: AdminReportRow;
  onClose: () => void;
  onResolve: (note: string) => void;
  onDismiss: (note: string) => void;
}) {
  const [note, setNote] = useState(report.resolutionNote ?? "");

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/25 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-[560px] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="text-base font-semibold text-text-primary">
            Chi tiết báo cáo
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-100 text-text-muted"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Người báo cáo</p>
              <p className="text-sm font-medium text-text-secondary">
                {report.reporter.name}
              </p>
              <p className="text-xs text-text-muted">
                @{report.reporter.username}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Lý do</p>
              <p className="text-sm font-medium text-text-secondary">
                {REASON_LABELS[report.reason]}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-text-muted mb-1">
              Mô tả chi tiết từ người báo cáo
            </p>
            <p className="text-sm text-text-secondary bg-surface-50 rounded-lg p-3">
              {report.detail || "Không có mô tả thêm"}
            </p>
          </div>

          <div>
            <p className="text-xs text-text-muted mb-1">Nội dung bị báo cáo</p>
            <p className="text-sm text-text-secondary bg-surface-50 rounded-lg p-3 italic">
              "{report.targetPreview}"
            </p>
            {report.targetAuthor && (
              <p className="text-xs text-text-muted mt-1.5">
                Tác giả: @{report.targetAuthor.username}
              </p>
            )}
            <a
              href={TARGET_LINKS[report.targetType]}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 mt-2"
            >
              <ExternalLink size={12} /> {TARGET_LINK_LABELS[report.targetType]}
            </a>
          </div>

          <div>
            <p className="text-xs text-text-muted mb-1">
              Ghi chú xử lý (tùy chọn)
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Vd: Đã ẩn bài viết và cảnh cáo tác giả..."
              className="w-full text-sm border border-surface-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>
        </div>

        {report.status === "PENDING" ? (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-surface-100">
            <button
              onClick={() => onDismiss(note)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-100"
            >
              Bỏ qua
            </button>
            <button
              onClick={() => onResolve(note)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600"
            >
              Đánh dấu đã xử lý
            </button>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-surface-100 text-xs text-text-muted">
            Đã {report.status === "RESOLVED" ? "xử lý" : "bỏ qua"} lúc{" "}
            {report.resolvedAt}
          </div>
        )}
      </div>
    </div>
  );
}
