"use client";
import { useState, useEffect } from "react";
import {
  X,
  Users as UsersIcon,
  Calendar,
  Flag,
  Loader2,
  Crown,
} from "lucide-react";
import { clsx } from "clsx";
import Avatar from "@/components/ui/Avatar";
import type { AdminGroupRow, AdminGroupMember } from "@/lib/admin/groups/types";

export function GroupDetailModal({
  group,
  onClose,
}: {
  group: AdminGroupRow;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<AdminGroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/groups/${group.id}/members`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [group.id]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 shrink-0">
          <h3 className="text-sm font-semibold text-text-primary">
            Chi tiết nhóm
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-100 text-text-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="flex items-center gap-3 mb-5">
            <Avatar
              src={group.avatarUrl ?? undefined}
              initials={group.name.slice(0, 2).toUpperCase()}
              size="lg"
              shape="rounded"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {group.name}
              </p>
              <p className="text-xs text-text-muted truncate">
                Trưởng nhóm: {group.leaderName} (@{group.leaderUsername})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-surface-50 rounded-xl px-3.5 py-3">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <UsersIcon size={13} />
                <span className="text-[11px] font-medium">Thành viên</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {group.acceptedMemberCount}/{group.memberCount}
              </p>
            </div>
            <div className="bg-surface-50 rounded-xl px-3.5 py-3">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Flag size={13} />
                <span className="text-[11px] font-medium">
                  Báo cáo đang chờ
                </span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {group.reportCount}
              </p>
            </div>
            <div className="bg-surface-50 rounded-xl px-3.5 py-3 col-span-2">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Calendar size={13} />
                <span className="text-[11px] font-medium">Ngày tạo</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {group.createdAt}
              </p>
            </div>
          </div>

          <div
            className={clsx(
              "text-xs font-medium px-3.5 py-2.5 rounded-xl text-center mb-5",
              group.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600",
            )}
          >
            {group.status === "ACTIVE"
              ? "Nhóm đang hoạt động"
              : "Nhóm đã bị vô hiệu hóa"}
          </div>

          <p className="text-xs font-semibold text-text-secondary mb-2">
            Danh sách thành viên
          </p>
          {loading ? (
            <div className="flex items-center justify-center py-6 text-text-muted text-xs gap-2">
              <Loader2 size={14} className="animate-spin" /> Đang tải...
            </div>
          ) : members.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">
              Không có thành viên
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-50"
                >
                  <Avatar
                    src={m.avatarUrl ?? undefined}
                    initials={m.displayName.slice(0, 2).toUpperCase()}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-text-primary truncate">
                        {m.displayName}
                      </p>
                      {m.isLeader && (
                        <Crown size={12} className="text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted">@{m.username}</p>
                  </div>
                  <span
                    className={clsx(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                      m.isAccepted
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600",
                    )}
                  >
                    {m.isAccepted ? "Đã tham gia" : "Đang chờ"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
