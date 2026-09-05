"use client";
import {
  Eye,
  CheckCircle2,
  XCircle,
  User,
  Users,
  FileText,
  MessageSquare,
  Mail,
  BookOpen,
} from "lucide-react";
import {
  REASON_LABELS,
  type AdminReportRow,
  type ReportTargetType,
} from "@/lib/reports/types";
import { clsx } from "clsx";

const TARGET_CONFIG: Record<
  ReportTargetType,
  { label: string; icon: typeof User; className: string }
> = {
  USER: {
    label: "Người dùng",
    icon: User,
    className: "bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400",
  },
  POST: {
    label: "Bài viết",
    icon: FileText,
    className: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  COMMENT: {
    label: "Bình luận",
    icon: MessageSquare,
    className: "bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400",
  },
  MESSAGE: {
    label: "Tin nhắn",
    icon: Mail,
    className: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  },
  DOCUMENT: {
    label: "Tài liệu",
    icon: BookOpen,
    className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  GROUP: {
    label: "Nhóm chat",
    icon: Users,
    className: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  },
};

function TargetBadge({ type }: { type: ReportTargetType }) {
  const cfg = TARGET_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
        cfg.className,
      )}
    >
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminReportRow["status"] }) {
  if (status === "PENDING")
    return (
      <span className="text-[11px] font-medium bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full whitespace-nowrap">
        Chưa xử lý
      </span>
    );
  if (status === "RESOLVED")
    return (
      <span className="text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full whitespace-nowrap">
        Đã xử lý
      </span>
    );
  return (
    <span className="text-[11px] font-medium bg-surface-100 text-text-muted px-2 py-0.5 rounded-full whitespace-nowrap">
      Đã bỏ qua
    </span>
  );
}

export function ReportsTable({
  reports,
  onViewDetail,
  onQuickResolve,
  onQuickDismiss,
}: {
  reports: AdminReportRow[];
  onViewDetail: (r: AdminReportRow) => void;
  onQuickResolve: (r: AdminReportRow) => void;
  onQuickDismiss: (r: AdminReportRow) => void;
}) {
  if (reports.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-surface-200 p-10 text-center text-sm text-text-muted">
        Không có báo cáo nào phù hợp
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-surface-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[920px]">
        <thead>
          <tr className="border-b border-surface-100 text-left text-text-muted text-xs uppercase tracking-wide">
            <th className="px-5 py-3 font-medium">Người báo cáo</th>
            <th className="px-5 py-3 font-medium">Đối tượng</th>
            <th className="px-5 py-3 font-medium">Nội dung</th>
            <th className="px-5 py-3 font-medium">Lý do</th>
            <th className="px-5 py-3 font-medium whitespace-nowrap">
              Trạng thái
            </th>
            <th className="px-5 py-3 font-medium whitespace-nowrap">
              Ngày báo cáo
            </th>
            <th className="px-5 py-3 font-medium w-[140px]" />
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr
              key={r.id}
              className="border-b border-surface-100 last:border-0 hover:bg-surface-50"
            >
              <td className="px-5 py-3">
                <p className="font-medium text-text-secondary truncate max-w-[140px]">
                  {r.reporter.name}
                </p>
                <p className="text-xs text-text-muted truncate max-w-[140px]">
                  @{r.reporter.username}
                </p>
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <TargetBadge type={r.targetType} />
                {r.targetAuthor && (
                  <p className="text-xs text-text-muted mt-1 truncate max-w-[140px]">
                    của @{r.targetAuthor.username}
                  </p>
                )}
              </td>
              <td className="px-5 py-3 max-w-[220px]">
                <p className="text-text-secondary truncate">{r.targetPreview}</p>
              </td>
              <td className="px-5 py-3 text-text-secondary whitespace-nowrap">
                {REASON_LABELS[r.reason]}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-5 py-3 text-text-muted whitespace-nowrap">
                {r.createdAt}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onViewDetail(r)}
                    title="Xem chi tiết"
                    className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-secondary"
                  >
                    <Eye size={15} />
                  </button>
                  {r.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => onQuickResolve(r)}
                        title="Đánh dấu đã xử lý"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-text-muted hover:text-emerald-500"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                      <button
                        onClick={() => onQuickDismiss(r)}
                        title="Bỏ qua báo cáo"
                        className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-secondary"
                      >
                        <XCircle size={15} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
