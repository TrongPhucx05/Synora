"use client";
import { Eye, FileText } from "lucide-react";
import { clsx } from "clsx";
import Avatar from "@/components/ui/Avatar";
import { EmptyPlaceholder } from "@/components/admin/EmptyPlaceholder";
import {
  ACTION_ICON,
  ACTION_LABELS,
  ACTION_BADGE,
  type AuditLogEntry,
} from "@/lib/audit-log/types";

export function AuditLogTable({
  entries,
  onViewDetail,
}: {
  entries: AuditLogEntry[];
  onViewDetail: (e: AuditLogEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <EmptyPlaceholder
        icon={FileText}
        title="Không tìm thấy nhật ký nào"
        description="Thử điều chỉnh bộ lọc hoặc khoảng thời gian"
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left font-semibold text-slate-500 text-xs px-5 py-3">
              Quản trị viên
            </th>
            <th className="text-left font-semibold text-slate-500 text-xs px-4 py-3">
              Thao tác
            </th>
            <th className="text-left font-semibold text-slate-500 text-xs px-4 py-3">
              Đối tượng
            </th>
            <th className="text-left font-semibold text-slate-500 text-xs px-4 py-3">
              Thời gian
            </th>
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const Icon = ACTION_ICON[e.action];
            return (
              <tr
                key={e.id}
                className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={e.actor.avatarUrl ?? undefined}
                      initials={e.actor.name.slice(0, 2).toUpperCase()}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {e.actor.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Quản trị viên
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                      ACTION_BADGE[e.action],
                    )}
                  >
                    <Icon size={11} />
                    {ACTION_LABELS[e.action]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 max-w-[280px] truncate">
                  {e.targetLabel}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {e.createdAt}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewDetail(e)}
                    title="Xem chi tiết"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
