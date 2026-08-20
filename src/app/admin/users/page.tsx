"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  UserFilters,
  type UserFilterState,
} from "@/components/admin/users/UserFilters";
import {
  UsersTable,
  type AdminUserRow,
} from "@/components/admin/users/UsersTable";
import { UserDetailModal } from "@/components/admin/users/UserDetailModal";
import {
  LockUserModal,
  type LockPayload,
} from "@/components/admin/users/LockUserModal";
import { Pagination } from "@/components/admin/Pagination";
import { useToast } from "@/components/ui/Toast";

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [filters, setFilters] = useState<UserFilterState>({
    query: "",
    status: "ALL",
  });
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [lockTarget, setLockTarget] = useState<AdminUserRow | null>(null);
  const [lockLoading, setLockLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [filters.query, filters.status]);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.query) params.set("query", filters.query);
    if (filters.status !== "ALL") params.set("status", filters.status);
    params.set("page", String(page));
    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data.items) ? data.items : []);
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleLock = async (payload: LockPayload) => {
    if (!lockTarget) return;
    setLockLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${lockTarget.id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error);
      }
      showToast(
        payload.type === "SUSPEND"
          ? "Đã tạm khóa tài khoản"
          : "Đã khóa vĩnh viễn tài khoản",
        "success",
      );
      setLockTarget(null);
      fetchUsers();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Không thể khóa tài khoản",
        "error",
      );
    } finally {
      setLockLoading(false);
    }
  };

  const handleUnlock = async (u: AdminUserRow) => {
    try {
      const res = await fetch(`/api/admin/users/${u.id}/unlock`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      showToast("Đã mở khóa tài khoản", "success");
      fetchUsers();
    } catch {
      showToast("Không thể mở khóa tài khoản", "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản và xử lý vi phạm"
      />

      <UserFilters value={filters} onChange={setFilters} />

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 flex items-center justify-center">
          <p className="text-sm text-slate-400">Đang tải...</p>
        </div>
      ) : (
        <>
          <UsersTable
            users={users}
            onViewDetail={setDetailUser}
            onLock={setLockTarget}
            onUnlock={handleUnlock}
          />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {detailUser && (
        <UserDetailModal
          user={detailUser}
          onClose={() => setDetailUser(null)}
        />
      )}

      {lockTarget && (
        <LockUserModal
          userName={lockTarget.name}
          loading={lockLoading}
          onConfirm={handleLock}
          onCancel={() => setLockTarget(null)}
        />
      )}
    </>
  );
}
