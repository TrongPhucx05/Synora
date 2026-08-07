"use client";
import { Search } from "lucide-react";
import { REASON_LABELS, type ReportReasonKey, type ReportStatus, type ReportTargetType } from "@/lib/reports/types";

export type ReportFilterState = {
  query: string;
  targetType: ReportTargetType | "ALL";
  status: ReportStatus | "ALL";
  reason: ReportReasonKey | "ALL";
};

const TARGET_LABELS: Record<ReportTargetType, string> = {
  USER: "Người dùng",
  POST: "Bài viết",
  COMMENT: "Bình luận",
  MESSAGE: "Tin nhắn",
  DOCUMENT: "Tài liệu",
};

export function ReportFilters({
  value,
  onChange,
}: {
  value: ReportFilterState;
  onChange: (v: ReportFilterState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-[260px]">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Tìm theo người báo cáo, nội dung..."
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <select
        value={value.targetType}
        onChange={(e) => onChange({ ...value, targetType: e.target.value as ReportFilterState["targetType"] })}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none"
      >
        <option value="ALL">Tất cả loại</option>
        {Object.entries(TARGET_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      <select
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value as ReportFilterState["status"] })}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none"
      >
        <option value="ALL">Tất cả trạng thái</option>
        <option value="PENDING">Chưa xử lý</option>
        <option value="RESOLVED">Đã xử lý</option>
        <option value="DISMISSED">Đã bỏ qua</option>
      </select>

      <select
        value={value.reason}
        onChange={(e) => onChange({ ...value, reason: e.target.value as ReportFilterState["reason"] })}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none"
      >
        <option value="ALL">Tất cả lý do</option>
        {Object.entries(REASON_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </div>
  );
}