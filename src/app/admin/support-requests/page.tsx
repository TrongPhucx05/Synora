"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  SupportRequestFilters,
  type SupportRequestFilterState,
} from "@/components/admin/support/SupportRequestFilters";
import { SupportRequestsTable } from "@/components/admin/support/SupportRequestsTable";
import { SupportRequestDetailModal } from "@/components/admin/support/SupportRequestDetailModal";
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
  const [detailRequest, setDetailRequest] =
    useState<AdminSupportRequestRow | null>(null);
  const [resolving, setResolving] = useState(false);

  const fetchRequests = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "ALL") params.set("status", filters.status);
    fetch(`/api/admin/support-requests?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [filters.status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filtered = useMemo(() => {
    const q = filters.query.toLowerCase();
    return requests.filter(
      (r) =>
        !q ||
        r.user.username.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q),
    );
  }, [requests, filters.query]);

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
        <SupportRequestsTable
          requests={filtered}
          onViewDetail={setDetailRequest}
        />
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
