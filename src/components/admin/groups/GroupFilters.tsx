"use client";
import { Search } from "lucide-react";
import { clsx } from "clsx";

export type GroupFilterState = {
  query: string;
  status: "ALL" | "ACTIVE" | "DISABLED";
};

const STATUS_OPTIONS: { value: GroupFilterState["status"]; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "DISABLED", label: "Đã vô hiệu hóa" },
];

export function GroupFilters({
  value,
  onChange,
}: {
  value: GroupFilterState;
  onChange: (next: GroupFilterState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3.5 py-2 flex-1 min-w-[240px]">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Tìm theo tên nhóm..."
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <select
        value={value.status}
        onChange={(e) =>
          onChange({
            ...value,
            status: e.target.value as GroupFilterState["status"],
          })
        }
        className={clsx(
          "bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700",
          "focus:outline-none focus:border-blue-400",
        )}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
