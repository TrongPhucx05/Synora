"use client";
import { Eye, LifeBuoy } from "lucide-react";
import { AdminStatusBadge } from "@/components/support/AdminStatusBadge";
import { TYPE_LABELS } from "@/lib/support/labels";
import type { AdminSupportRequestRow } from "@/lib/support/types";

export function SupportRequestsTable({
  requests,
  onViewDetail,
}: {
  requests: AdminSupportRequestRow[];
  onViewDetail: (r: AdminSupportRequestRow) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-surface-200 p-10 text-center text-sm text-text-muted">
        <LifeBuoy size={22} className="mx-auto mb-2 opacity-40" />
        Không có yêu cầu hỗ trợ nào phù hợp
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-surface-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[820px]">
        <thead>
          <tr className="border-b border-surface-100 text-left text-text-muted text-xs uppercase tracking-wide">
            <th className="px-5 py-3 font-medium">Mã yêu cầu</th>
            <th className="px-5 py-3 font-medium">Người gửi</th>
            <th className="px-5 py-3 font-medium">Tiêu đề</th>
            <th className="px-5 py-3 font-medium whitespace-nowrap">
              Trạng thái
            </th>
            <th className="px-5 py-3 font-medium whitespace-nowrap">
              Ngày gửi
            </th>
            <th className="px-5 py-3 font-medium w-[80px]" />
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr
              key={r.id}
              className="border-b border-surface-100 last:border-0 hover:bg-surface-50 cursor-pointer"
              onClick={() => onViewDetail(r)}
            >
              <td className="px-5 py-3">
                <p className="font-mono text-xs text-text-muted">{r.code}</p>
              </td>
              <td className="px-5 py-3">
                {r.user ? (
                  <>
                    <p className="font-medium text-text-secondary truncate max-w-[160px]">
                      {r.user.name}
                    </p>
                    <p className="text-xs text-text-muted truncate max-w-[160px]">
                      @{r.user.username}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-text-secondary truncate max-w-[160px]">
                      {r.guestName || "Khách"}
                    </p>
                    <p className="text-xs text-text-muted truncate max-w-[160px]">
                      {r.contactEmail}
                    </p>
                  </>
                )}
              </td>
              <td className="px-5 py-3 max-w-[280px]">
                <p className="text-text-secondary truncate">{r.subject}</p>
                <span className="text-[10px] font-medium bg-surface-100 text-text-muted px-1.5 py-0.5 rounded-full mt-1 inline-block whitespace-nowrap">
                  {TYPE_LABELS[r.type]}
                </span>
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <AdminStatusBadge status={r.status} />
              </td>
              <td className="px-5 py-3 text-text-muted whitespace-nowrap">
                {new Date(r.createdAt).toLocaleDateString("vi-VN")}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetail(r);
                  }}
                  title="Xem chi tiết"
                  className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-secondary"
                >
                  <Eye size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}