"use client";
import { Search } from "lucide-react";
import type { SupportRequestStatus } from "@/lib/support/types";

export type SupportRequestFilterState = {
  query: string;
  status: SupportRequestStatus | "ALL";
};

export function SupportRequestFilters({
  value,
  onChange,
}: {
  value: SupportRequestFilterState;
  onChange: (v: SupportRequestFilterState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-[260px]">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Tìm theo người gửi, tiêu đề..."
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <select
        value={value.status}
        onChange={(e) =>
          onChange({
            ...value,
            status: e.target.value as SupportRequestFilterState["status"],
          })
        }
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none"
      >
        <option value="ALL">Tất cả trạng thái</option>
        <option value="PENDING">Chưa xử lý</option>
        <option value="RESOLVED">Đã xử lý</option>
      </select>
    </div>
  );
}
