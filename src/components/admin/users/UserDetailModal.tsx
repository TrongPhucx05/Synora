"use client";
import { useState, useEffect } from "react";
import { X, User, History, Flag } from "lucide-react";
import { clsx } from "clsx";
import Avatar from "@/components/ui/Avatar";
import type { AdminUserRow } from "./UsersTable";

type Tab = "profile" | "violations" | "reports";

type Violation = {
  id: string;
  action: string;
  reason: string;
  note: string | null;
  adminUsername: string;
  date: string;
};

type ReportAgainst = {
  id: string;
  reason: string;
  description: string | null;
  isResolved: boolean;
  reporter: string;
  date: string;
};

export function UserDetailModal({
  user,
  onClose,
}: {
  user: AdminUserRow;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("profile");
  const [violations, setViolations] = useState<Violation[] | null>(null);
  const [reports, setReports] = useState<ReportAgainst[] | null>(null);

  useEffect(() => {
    if (tab === "violations" && violations === null) {
      fetch(`/api/admin/users/${user.id}/violations`)
        .then((r) => r.json())
        .then((data) => setViolations(Array.isArray(data) ? data : []))
        .catch(() => setViolations([]));
    }
    if (tab === "reports" && reports === null) {
      fetch(`/api/admin/users/${user.id}/reports`)
        .then((r) => r.json())
        .then((data) => setReports(Array.isArray(data) ? data : []))
        .catch(() => setReports([]));
    }
  }, [tab, user.id, violations, reports]);

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "profile", label: "Hồ sơ", icon: User },
    { key: "violations", label: "Lịch sử vi phạm", icon: History },
    { key: "reports", label: "Lịch sử báo cáo", icon: Flag },
  ];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 dark:bg-black/25 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar
              src={user.avatarUrl ?? undefined}
              initials={user.name.slice(0, 2).toUpperCase()}
              size="md"
              shape="circle"
            />
            <div>
              <p className="text-sm font-bold text-text-primary">{user.name}</p>
              <p className="text-xs text-text-muted">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors text-text-muted hover:text-text-secondary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1.5 px-5 py-3 border-b border-surface-100 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                tab === t.key
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "bg-surface-100 text-text-muted hover:bg-surface-200",
              )}
            >
              <t.icon size={12} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {tab === "profile" && (
            <div className="flex flex-col gap-3">
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Vai trò" value={user.role} />
              <DetailRow
                label="Trạng thái"
                value={
                  user.status === "ACTIVE"
                    ? "Đang hoạt động"
                    : user.status === "SUSPENDED"
                      ? "Tạm khóa"
                      : "Khóa vĩnh viễn"
                }
              />
              <DetailRow label="Ngày tham gia" value={user.joinedAt} />
            </div>
          )}

          {tab === "violations" && (
            <div className="flex flex-col gap-2.5">
              {violations === null ? (
                <SkeletonList />
              ) : violations.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-8">
                  Chưa có vi phạm nào
                </p>
              ) : (
                violations.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-start justify-between gap-3 bg-surface-50 rounded-xl px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary">
                        {v.action}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {v.reason}
                      </p>
                      {v.note && (
                        <p className="text-[11px] text-text-muted mt-0.5 italic">
                          "{v.note}"
                        </p>
                      )}
                      <p className="text-[10px] text-text-muted mt-1">
                        Bởi admin @{v.adminUsername}
                      </p>
                    </div>
                    <span className="text-[11px] text-text-muted shrink-0">
                      {v.date}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "reports" && (
            <div className="flex flex-col gap-2.5">
              {reports === null ? (
                <SkeletonList />
              ) : reports.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-8">
                  Chưa từng bị báo cáo
                </p>
              ) : (
                reports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start justify-between gap-3 bg-surface-50 rounded-xl px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary">
                        {r.reason}
                      </p>
                      {r.description && (
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {r.description}
                        </p>
                      )}
                      <p className="text-[10px] text-text-muted mt-1">
                        Báo cáo bởi {r.reporter} ·{" "}
                        {r.isResolved ? "Đã xử lý" : "Chưa xử lý"}
                      </p>
                    </div>
                    <span className="text-[11px] text-text-muted shrink-0">
                      {r.date}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-surface-100 last:border-b-0">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-xs font-medium text-text-primary">{value}</p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-2.5 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-14 bg-surface-50 rounded-xl" />
      ))}
    </div>
  );
}
