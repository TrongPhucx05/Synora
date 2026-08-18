"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  AuditLogFilters,
  type AuditLogFilterState,
} from "@/components/admin/audit-log/AuditLogFilters";
import { AuditLogTable } from "@/components/admin/audit-log/AuditLogTable";
import { AuditLogDetailModal } from "@/components/admin/audit-log/AuditLogDetailModal";
import { Pagination } from "@/components/admin/Pagination";
import type { AuditLogEntry } from "@/lib/audit-log/types";

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilterState>({
    query: "",
    group: "ALL",
    dateFrom: "",
    dateTo: "",
  });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rangeDays, setRangeDays] = useState<number | null>(null);
  const [detailEntry, setDetailEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(filters.query.trim()), 350);
    return () => clearTimeout(t);
  }, [filters.query]);

  useEffect(() => {
    setPage(1);
  }, [filters.group, filters.dateFrom, filters.dateTo, debouncedQuery]);

  const fetchEntries = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.group !== "ALL") params.set("group", filters.group);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (debouncedQuery) params.set("query", debouncedQuery);
    params.set("page", String(page));
    fetch(`/api/admin/audit-log?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setTotalPages(data.totalPages ?? 1);
        setRangeDays(data.rangeDays ?? null);
      })
      .finally(() => setLoading(false));
  }, [filters.group, filters.dateFrom, filters.dateTo, debouncedQuery, page]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const showRangeHint = rangeDays && !filters.dateFrom && !filters.dateTo;

  return (
    <>
      <PageHeader
        title="Nhật ký quản trị"
        description="Ghi lại các thao tác khóa/mở khóa tài khoản, xóa bài viết và quản lý nhóm chat của quản trị viên"
      />

      <AuditLogFilters value={filters} onChange={setFilters} />

      {showRangeHint && (
        <p className="text-xs text-slate-400 -mt-3 mb-4">
          Đang hiển thị {rangeDays} ngày gần nhất. Chọn khoảng ngày ở trên để
          xem xa hơn.
        </p>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 flex items-center justify-center">
          <p className="text-sm text-slate-400">Đang tải...</p>
        </div>
      ) : (
        <>
          <AuditLogTable entries={entries} onViewDetail={setDetailEntry} />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {detailEntry && (
        <AuditLogDetailModal
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
        />
      )}
    </>
  );
}
