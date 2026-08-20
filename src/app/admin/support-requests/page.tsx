"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  SupportRequestFilters,
  type SupportRequestFilterState,
} from "@/components/admin/support/SupportRequestFilters";
import { SupportRequestsTable } from "@/components/admin/support/SupportRequestsTable";
import { SupportRequestDetailModal } from "@/components/admin/support/SupportRequestDetailModal";
import { Pagination } from "@/components/admin/Pagination";
import { useToast } from "@/components/ui/Toast";
import type { AdminSupportRequestRow } from "@/lib/support/types";

export default function AdminSupportRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<AdminSupportRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SupportRequestFilterState>({
    query: "",
    status: "ALL",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailRequest, setDetailRequest] =
    useState<AdminSupportRequestRow | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [filters.query, filters.status]);

  const fetchRequests = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "ALL") params.set("status", filters.status);
    if (filters.query) params.set("query", filters.query);
    params.set("page", String(page));
    fetch(`/api/admin/support-requests?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data.items) ? data.items : []);
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => {
    const t = setTimeout(fetchRequests, 300);
    return () => clearTimeout(t);
  }, [fetchRequests]);

  const handleResolve = async (reply: string) => {
    if (!detailRequest) return;
    setResolving(true);
    try {
      const res = await fetch(
        `/api/admin/support-requests/${detailRequest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reply }),
        },
      );
      if (!res.ok) throw new Error();
      showToast("Đã gửi phản hồi và đánh dấu đã xử lý", "success");
      fetchRequests();
      setDetailRequest(null);
    } catch {
      showToast("Không thể cập nhật yêu cầu", "error");
    } finally {
      setResolving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Yêu cầu hỗ trợ"
        description="Xem và phản hồi các yêu cầu hỗ trợ / khiếu nại từ người dùng"
      />

      <SupportRequestFilters value={filters} onChange={setFilters} />

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          Đang tải...
        </div>
      ) : (
        <>
          <SupportRequestsTable
            requests={requests}
            onViewDetail={setDetailRequest}
          />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {detailRequest && (
        <SupportRequestDetailModal
          request={detailRequest}
          onClose={() => !resolving && setDetailRequest(null)}
          onResolve={handleResolve}
        />
      )}
    </>
  );
}
