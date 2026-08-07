"use client";
import {
  Eye,
  CheckCircle2,
  XCircle,
  User,
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
    className: "bg-orange-50 text-orange-600",
  },
  POST: {
    label: "Bài viết",
    icon: FileText,
    className: "bg-blue-50 text-blue-600",
  },
  COMMENT: {
    label: "Bình luận",
    icon: MessageSquare,
    className: "bg-purple-50 text-purple-600",
  },
  MESSAGE: {
    label: "Tin nhắn",
    icon: Mail,
    className: "bg-cyan-50 text-cyan-600",
  },
  DOCUMENT: {
    label: "Tài liệu",
    icon: BookOpen,
    className: "bg-emerald-50 text-emerald-600",
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
      <span className="text-[11px] font-medium bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full whitespace-nowrap">
        Chưa xử lý
      </span>
    );
  if (status === "RESOLVED")
    return (
      <span className="text-[11px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full whitespace-nowrap">
        Đã xử lý
      </span>
    );
  return (
    <span className="text-[11px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full whitespace-nowrap">
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
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
        Không có báo cáo nào phù hợp
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[920px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-slate-400 text-xs uppercase tracking-wide">
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
              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
            >
              <td className="px-5 py-3">
                <p className="font-medium text-slate-700 truncate max-w-[140px]">
                  {r.reporter.name}
                </p>
                <p className="text-xs text-slate-400 truncate max-w-[140px]">
                  @{r.reporter.username}
                </p>
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <TargetBadge type={r.targetType} />
                {r.targetAuthor && (
                  <p className="text-xs text-slate-400 mt-1 truncate max-w-[140px]">
                    của @{r.targetAuthor.username}
                  </p>
                )}
              </td>
              <td className="px-5 py-3 max-w-[220px]">
                <p className="text-slate-600 truncate">{r.targetPreview}</p>
              </td>
              <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                {REASON_LABELS[r.reason]}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                {r.createdAt}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onViewDetail(r)}
                    title="Xem chi tiết"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  >
                    <Eye size={15} />
                  </button>
                  {r.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => onQuickResolve(r)}
                        title="Đánh dấu đã xử lý"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-500"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                      <button
                        onClick={() => onQuickDismiss(r)}
                        title="Bỏ qua báo cáo"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
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
