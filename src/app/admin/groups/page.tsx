"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  GroupFilters,
  type GroupFilterState,
} from "@/components/admin/groups/GroupFilters";
import { GroupsTable } from "@/components/admin/groups/GroupsTable";
import { GroupDetailModal } from "@/components/admin/groups/GroupDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import { useToast } from "@/components/ui/Toast";
import { Ban, CheckCircle2, Trash2 } from "lucide-react";
import type { AdminGroupRow } from "@/lib/admin/groups/types";

type ConfirmState =
  | { type: "disable"; group: AdminGroupRow }
  | { type: "enable"; group: AdminGroupRow }
  | { type: "delete"; group: AdminGroupRow }
  | null;

export default function AdminGroupsPage() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<AdminGroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GroupFilterState>({
    query: "",
    status: "ALL",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailGroup, setDetailGroup] = useState<AdminGroupRow | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [filters.query, filters.status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.query) params.set("query", filters.query);
      if (filters.status !== "ALL") params.set("status", filters.status);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/groups?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data.items) ? data.items : []);
        setTotalPages(data.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleConfirm = async () => {
    if (!confirmState) return;
    setConfirmLoading(true);
    try {
      if (confirmState.type === "delete") {
        const res = await fetch(`/api/admin/groups/${confirmState.group.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        showToast("Đã xóa nhóm", "success");
        load();
      } else {
        const res = await fetch(`/api/admin/groups/${confirmState.group.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: confirmState.type }),
        });
        if (!res.ok) throw new Error();
        const nextStatus =
          confirmState.type === "disable" ? "DISABLED" : "ACTIVE";
        setGroups((prev) =>
          prev.map((g) =>
            g.id === confirmState.group.id ? { ...g, status: nextStatus } : g,
          ),
        );
        showToast(
          confirmState.type === "disable"
            ? "Đã vô hiệu hóa nhóm"
            : "Đã mở lại nhóm",
          "success",
        );
      }
    } catch {
      showToast("Có lỗi xảy ra, vui lòng thử lại", "error");
    } finally {
      setConfirmLoading(false);
      setConfirmState(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Quản lý nhóm chat"
        description="Xem, vô hiệu hóa hoặc xóa nhóm chat khi có vi phạm"
      />

      <GroupFilters value={filters} onChange={setFilters} />

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 flex items-center justify-center">
          <p className="text-sm text-slate-400">Đang tải...</p>
        </div>
      ) : (
        <>
          <GroupsTable
            groups={groups}
            onViewDetail={setDetailGroup}
            onDisable={(g) => setConfirmState({ type: "disable", group: g })}
            onEnable={(g) => setConfirmState({ type: "enable", group: g })}
            onDelete={(g) => setConfirmState({ type: "delete", group: g })}
          />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {detailGroup && (
        <GroupDetailModal
          group={detailGroup}
          onClose={() => setDetailGroup(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          icon={
            confirmState.type === "enable" ? (
              <CheckCircle2 size={20} className="text-emerald-500" />
            ) : confirmState.type === "disable" ? (
              <Ban size={20} className="text-amber-500" />
            ) : (
              <Trash2 size={20} className="text-red-500" />
            )
          }
          iconBgClass={
            confirmState.type === "enable"
              ? "bg-emerald-100"
              : confirmState.type === "disable"
                ? "bg-amber-100"
                : "bg-red-100"
          }
          title={
            confirmState.type === "enable"
              ? "Mở lại nhóm?"
              : confirmState.type === "disable"
                ? "Vô hiệu hóa nhóm?"
                : "Xóa nhóm vĩnh viễn?"
          }
          description={
            <>
              Áp dụng cho{" "}
              <span className="font-medium text-slate-700">
                {confirmState.group.name}
              </span>
              {confirmState.type === "delete" &&
                " và toàn bộ tin nhắn, thành viên bên trong"}
              .
            </>
          }
          confirmLabel={
            confirmState.type === "enable"
              ? "Mở lại"
              : confirmState.type === "disable"
                ? "Vô hiệu hóa"
                : "Xóa nhóm"
          }
          confirmVariant={confirmState.type === "enable" ? "primary" : "danger"}
          loading={confirmLoading}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </>
  );
}