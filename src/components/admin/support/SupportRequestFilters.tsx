"use client";
import { Search } from "lucide-react";
import { TYPE_LABELS } from "@/lib/support/labels";
import type { SupportRequestStatus, SupportRequestType } from "@/lib/support/types";

export type SupportRequestFilterState = {
  query: string;
  status: SupportRequestStatus | "ALL";
  type: SupportRequestType | "ALL";
};

const STATUS_OPTIONS: { value: SupportRequestStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "WAITING_FOR_USER", label: "Chờ người dùng" },
  { value: "RESOLVED", label: "Đã xử lý" },
  { value: "CLOSED", label: "Đã đóng" },
  { value: "REJECTED", label: "Từ chối" },
];

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
          placeholder="Tìm theo mã, email, người gửi, tiêu đề..."
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <select
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value as SupportRequestFilterState["status"] })}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <select
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value as SupportRequestFilterState["type"] })}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none"
      >
        <option value="ALL">Tất cả loại</option>
        {(Object.keys(TYPE_LABELS) as SupportRequestType[]).map((t) => (
          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
        ))}
      </select>
    </div>
  );
}