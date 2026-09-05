"use client";
import { Search } from "lucide-react";
import type { ContentStatus } from "@/lib/content/types";

export type ContentFilterState = {
  query: string;
  status: ContentStatus | "ALL";
  onlyReported: boolean;
};

export function ContentFilters({
  value,
  onChange,
  searchPlaceholder,
}: {
  value: ContentFilterState;
  onChange: (v: ContentFilterState) => void;
  searchPlaceholder: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2 bg-surface border border-surface-200 rounded-lg px-3 py-2 w-[280px]">
        <Search size={15} className="text-text-muted shrink-0" />
        <input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder={searchPlaceholder}
          className="flex-1 bg-transparent text-sm text-text-secondary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <select
        value={value.status}
        onChange={(e) =>
          onChange({ ...value, status: e.target.value as ContentFilterState["status"] })
        }
        className="text-sm border border-surface-200 rounded-lg px-3 py-2 text-text-secondary bg-surface focus:outline-none"
      >
        <option value="ALL">Tất cả trạng thái</option>
        <option value="VISIBLE">Đang hiển thị</option>
        <option value="HIDDEN">Đã ẩn</option>
      </select>

      <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
        <input
          type="checkbox"
          checked={value.onlyReported}
          onChange={(e) => onChange({ ...value, onlyReported: e.target.checked })}
          className="rounded border-surface-200 text-blue-500 dark:text-blue-400 focus:ring-blue-400"
        />
        Chỉ hiện nội dung bị báo cáo
      </label>
    </div>
  );
}