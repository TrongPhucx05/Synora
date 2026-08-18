"use client";
import { Search } from "lucide-react";
import { GROUP_LABELS } from "@/lib/audit-log/types";

export type AuditLogFilterState = {
  query: string;
  group: "ALL" | "USER" | "GROUP" | "CONTENT";
  dateFrom: string;
  dateTo: string;
};

export function AuditLogFilters({
  value,
  onChange,
}: {
  value: AuditLogFilterState;
  onChange: (next: AuditLogFilterState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3.5 py-2 flex-1 min-w-[240px]">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Tìm theo quản trị viên, đối tượng..."
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <select
        value={value.group}
        onChange={(e) =>
          onChange({
            ...value,
            group: e.target.value as AuditLogFilterState["group"],
          })
        }
        className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400"
      >
        {Object.entries(GROUP_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={value.dateFrom}
        onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
        className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400"
      />
      <span className="text-xs text-slate-400">đến</span>
      <input
        type="date"
        value={value.dateTo}
        onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
        className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400"
      />
    </div>
  );
}
