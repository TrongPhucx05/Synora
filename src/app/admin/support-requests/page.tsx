"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import {
  SupportRequestFilters,
  type SupportRequestFilterState,
} from "@/components/admin/support/SupportRequestFilters";
import { SupportRequestsTable } from "@/components/admin/support/SupportRequestsTable";
import { SupportRequestDetailModal } from "@/components/admin/support/SupportRequestDetailModal";
import { useToast } from "@/components/ui/Toast";
import type {
  AdminSupportRequestRow,
  SupportRequestStatus,
} from "@/lib/support/types";

export default function AdminSupportRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<AdminSupportRequestRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SupportRequestFilterState>({
    query: "",
    status: "ALL",
    type: "ALL",
  });
  const [detailRequest, setDetailRequest] =
    useState<AdminSupportRequestRow | null>(null);
  const [resolving, setResolving] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchRequests = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "ALL") params.set("status", filters.status);
    if (filters.type !== "ALL") params.set("type", filters.type);
    if (filters.query) params.set("query", filters.query);
    params.set("page", String(page));
    fetch(`/api/admin/support-requests?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data.items) ? data.items : []);
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [filters.status, filters.type, filters.query, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);
  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.type, filters.query]);

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    if (!requestId) return;
    fetch(`/api/admin/support-requests/${requestId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDetailRequest(data);
        router.replace("/admin/support-requests");
      });
  }, [searchParams, router]);

  const handleUpdate = async (status: SupportRequestStatus, reply: string) => {
    if (!detailRequest) return;
    setResolving(true);
    try {
      const res = await fetch(
        `/api/admin/support-requests/${detailRequest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reply }),
        },
      );
      if (!res.ok) throw new Error();
      showToast("Đã cập nhật yêu cầu và gửi email cho người dùng", "success");
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
        description="Xem và phản hồi các yêu cầu hỗ trợ / khiếu nại từ người dùng và khách"
      />
      <SupportRequestFilters value={filters} onChange={setFilters} />
      {loading ? (
        <div className="bg-surface rounded-2xl border border-surface-200 p-10 text-center text-sm text-text-muted">
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
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}
