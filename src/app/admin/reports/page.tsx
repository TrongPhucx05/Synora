"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  ReportFilters,
  type ReportFilterState,
} from "@/components/admin/reports/ReportFilters";
import { ReportsTable } from "@/components/admin/reports/ReportsTable";
import { ReportDetailModal } from "@/components/admin/reports/ReportDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle2, XCircle } from "lucide-react";
import type { AdminReportRow } from "@/lib/reports/types";

type ConfirmState = {
  kind: "resolve" | "dismiss";
  report: AdminReportRow;
  note: string;
} | null;

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilterState>({
    query: "",
    targetType: "ALL",
    status: "ALL",
    reason: "ALL",
  });
  const [detailReport, setDetailReport] = useState<AdminReportRow | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchReports = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "ALL") params.set("status", filters.status);
    if (filters.reason !== "ALL") params.set("reason", filters.reason);
    fetch(`/api/admin/reports?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [filters.status, filters.reason]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filtered = useMemo(() => {
    const q = filters.query.toLowerCase();
    return reports.filter(
      (r) =>
        (!q ||
          r.reporter.username.toLowerCase().includes(q) ||
          r.targetPreview.toLowerCase().includes(q)) &&
        (filters.targetType === "ALL" || r.targetType === filters.targetType),
    );
  }, [reports, filters.query, filters.targetType]);

  const applyResolution = async (
    kind: "resolve" | "dismiss",
    report: AdminReportRow,
    note: string,
  ) => {
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: kind, note }),
      });
      if (!res.ok) throw new Error();
      showToast(
        kind === "resolve"
          ? "Đã đánh dấu báo cáo là đã xử lý"
          : "Đã bỏ qua báo cáo",
        "success",
      );
      fetchReports();
    } catch {
      showToast("Không thể cập nhật báo cáo", "error");
    } finally {
      setConfirmLoading(false);
      setConfirmState(null);
      setDetailReport(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Quản lý báo cáo"
        description="Xử lý báo cáo về người dùng, bài viết, bình luận và tin nhắn"
      />

      <ReportFilters value={filters} onChange={setFilters} />

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          Đang tải...
        </div>
      ) : (
        <ReportsTable
          reports={filtered}
          onViewDetail={setDetailReport}
          onQuickResolve={(r) =>
            setConfirmState({ kind: "resolve", report: r, note: "" })
          }
          onQuickDismiss={(r) =>
            setConfirmState({ kind: "dismiss", report: r, note: "" })
          }
        />
      )}

      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          onResolve={(note) => applyResolution("resolve", detailReport, note)}
          onDismiss={(note) => applyResolution("dismiss", detailReport, note)}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          icon={
            confirmState.kind === "resolve" ? (
              <CheckCircle2 size={20} className="text-emerald-500" />
            ) : (
              <XCircle size={20} className="text-slate-500" />
            )
          }
          iconBgClass={
            confirmState.kind === "resolve" ? "bg-emerald-100" : "bg-slate-100"
          }
          title={
            confirmState.kind === "resolve"
              ? "Đánh dấu báo cáo đã xử lý?"
              : "Bỏ qua báo cáo này?"
          }
          description="Bạn có thể xem lại ghi chú xử lý trong phần chi tiết báo cáo bất kỳ lúc nào."
          confirmLabel={
            confirmState.kind === "resolve" ? "Đánh dấu đã xử lý" : "Bỏ qua"
          }
          confirmVariant="primary"
          loading={confirmLoading}
          onConfirm={() =>
            applyResolution(
              confirmState.kind,
              confirmState.report,
              confirmState.note,
            )
          }
          onCancel={() => setConfirmState(null)}
        />
      )}
    </>
  );
}
