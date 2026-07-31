"use client";
import { Eye, LifeBuoy } from "lucide-react";
import { clsx } from "clsx";
import type { AdminSupportRequestRow } from "@/lib/support/types";

function StatusBadge({ status }: { status: AdminSupportRequestRow["status"] }) {
  if (status === "PENDING")
    return (
      <span className="text-[11px] font-medium bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
        Chưa xử lý
      </span>
    );
  return (
    <span className="text-[11px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
      Đã xử lý
    </span>
  );
}

export function SupportRequestsTable({
  requests,
  onViewDetail,
}: {
  requests: AdminSupportRequestRow[];
  onViewDetail: (r: AdminSupportRequestRow) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
        <LifeBuoy size={22} className="mx-auto mb-2 opacity-40" />
        Không có yêu cầu hỗ trợ nào phù hợp
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-slate-400 text-xs uppercase tracking-wide">
            <th className="px-5 py-3 font-medium">Người gửi</th>
            <th className="px-5 py-3 font-medium">Tiêu đề</th>
            <th className="px-5 py-3 font-medium">Trạng thái</th>
            <th className="px-5 py-3 font-medium">Ngày gửi</th>
            <th className="px-5 py-3 font-medium w-[80px]" />
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr
              key={r.id}
              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 cursor-pointer"
              onClick={() => onViewDetail(r)}
            >
              <td className="px-5 py-3">
                <p className="font-medium text-slate-700">{r.user.name}</p>
                <p className="text-xs text-slate-400">@{r.user.username}</p>
              </td>
              <td className="px-5 py-3 max-w-[300px]">
                <p className="text-slate-600 truncate">{r.subject}</p>
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-5 py-3 text-slate-500">{r.createdAt}</td>
              <td className="px-5 py-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetail(r);
                  }}
                  title="Xem chi tiết"
                  className={clsx(
                    "p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600",
                  )}
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
