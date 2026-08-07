"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DocumentsTable } from "@/components/admin/library/DocumentsTable";
import { DeleteDocumentDialog } from "@/components/admin/library/DeleteDocumentDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Search, EyeOff, Eye } from "lucide-react";
import type { AdminDocumentRow, ContentStatus } from "@/lib/content/types";
import type { ViolationReason } from "@/lib/admin/moderation";

type HideConfirm = { item: AdminDocumentRow } | null;
type DeleteConfirm = { item: AdminDocumentRow } | null;

export default function AdminLibraryPage() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<AdminDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContentStatus | "ALL">("ALL");
  const [onlyReported, setOnlyReported] = useState(false);

  const [hideConfirm, setHideConfirm] = useState<HideConfirm>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    fetch(`/api/admin/documents?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setDocuments(data))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return documents.filter(
      (d) =>
        (!q ||
          d.title.toLowerCase().includes(q) ||
          d.author.username.toLowerCase().includes(q)) &&
        (!onlyReported || d.reportCount > 0),
    );
  }, [documents, query, onlyReported]);

  const handleToggleHide = async () => {
    if (!hideConfirm) return;
    setActionLoading(true);
    try {
      const next = hideConfirm.item.status !== "HIDDEN";
      const res = await fetch(`/api/admin/documents/${hideConfirm.item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: next }),
      });
      if (!res.ok) throw new Error();
      showToast(next ? "Đã ẩn tài liệu" : "Đã bỏ ẩn tài liệu", "success");
      fetchData();
    } catch {
      showToast("Thao tác thất bại", "error");
    } finally {
      setActionLoading(false);
      setHideConfirm(null);
    }
  };

  const handleDelete = async (reason: ViolationReason, note: string) => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/documents/${deleteConfirm.item.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, note: note || undefined }),
      });
      if (!res.ok) throw new Error();
      showToast("Đã xóa tài liệu và gửi thông báo", "success");
      fetchData();
    } catch {
      showToast("Xóa thất bại", "error");
    } finally {
      setActionLoading(false);
      setDeleteConfirm(null);
    }
  };

  const isUnhide = hideConfirm?.item.status === "HIDDEN";

  return (
    <>
      <PageHeader
        title="Quản lý tài liệu"
        description="Xử lý tài liệu vi phạm, bị báo cáo trong Thư viện"
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-[280px]">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, người tải lên..."
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ContentStatus | "ALL")}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 bg-white focus:outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="VISIBLE">Đang hiển thị</option>
          <option value="HIDDEN">Đã ẩn</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyReported}
            onChange={(e) => setOnlyReported(e.target.checked)}
            className="rounded border-slate-300 text-blue-500 focus:ring-blue-400"
          />
          Chỉ hiện tài liệu bị báo cáo
        </label>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          Đang tải...
        </div>
      ) : (
        <DocumentsTable
          documents={filtered}
          onToggleVisibility={(d) => setHideConfirm({ item: d })}
          onDelete={(d) => setDeleteConfirm({ item: d })}
        />
      )}

      {hideConfirm && (
        <ConfirmDialog
          icon={
            isUnhide ? (
              <Eye size={20} className="text-emerald-500" />
            ) : (
              <EyeOff size={20} className="text-amber-500" />
            )
          }
          iconBgClass={isUnhide ? "bg-emerald-100" : "bg-amber-100"}
          title={isUnhide ? "Bỏ ẩn tài liệu?" : "Ẩn tài liệu này?"}
          description="Tài liệu sẽ tạm thời không hiển thị trong Thư viện cho tới khi được bỏ ẩn."
          confirmLabel={isUnhide ? "Bỏ ẩn" : "Ẩn tài liệu"}
          confirmVariant="primary"
          loading={actionLoading}
          onConfirm={handleToggleHide}
          onCancel={() => setHideConfirm(null)}
        />
      )}

      {deleteConfirm && (
        <DeleteDocumentDialog
          documentTitle={deleteConfirm.item.title}
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
