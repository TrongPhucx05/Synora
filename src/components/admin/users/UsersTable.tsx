"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { clsx } from "clsx";
import Avatar from "@/components/ui/Avatar";
import { UserActionsMenu } from "./UserActionsMenu";
import { formatDateTime } from "@/lib/admin/account-lock";

export type AdminUserRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  suspendedUntil: string | null;
  joinedAt: string;
};

const ROLE_BADGE: Record<AdminUserRow["role"], string> = {
  USER: "bg-slate-100 text-slate-600",
  ADMIN: "bg-blue-50 text-blue-600",
};

const STATUS_BADGE: Record<AdminUserRow["status"], string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600",
  SUSPENDED: "bg-amber-50 text-amber-600",
  BANNED: "bg-red-50 text-red-600",
};

const STATUS_LABEL: Record<AdminUserRow["status"], string> = {
  ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm khóa",
  BANNED: "Khóa vĩnh viễn",
};

export function UsersTable({
  users,
  onViewDetail,
  onLock,
  onUnlock,
}: {
  users: AdminUserRow[];
  onViewDetail: (u: AdminUserRow) => void;
  onLock: (u: AdminUserRow) => void;
  onUnlock: (u: AdminUserRow) => void;
}) {
  const [menuAnchor, setMenuAnchor] = useState<{
    id: string;
    el: HTMLElement;
  } | null>(null);
  const activeUser = users.find((u) => u.id === menuAnchor?.id) ?? null;

  if (users.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl py-16 flex items-center justify-center">
        <p className="text-sm text-slate-400">Không tìm thấy người dùng nào</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed min-w-[640px]">
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[12%]" />
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left font-semibold text-slate-500 text-xs px-5 py-3">
                Người dùng
              </th>
              <th className="text-left font-semibold text-slate-500 text-xs px-3 py-3">
                Vai trò
              </th>
              <th className="text-left font-semibold text-slate-500 text-xs px-3 py-3">
                Trạng thái
              </th>
              <th className="text-left font-semibold text-slate-500 text-xs px-3 py-3">
                Ngày tham gia
              </th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-5 py-3">
                  <button
                    onClick={() => onViewDetail(u)}
                    className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
                  >
                    <Avatar
                      src={u.avatarUrl ?? undefined}
                      initials={u.name.slice(0, 2).toUpperCase()}
                      size="sm"
                      shape="circle"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        @{u.username}
                      </p>
                    </div>
                  </button>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={clsx(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                      ROLE_BADGE[u.role],
                    )}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={clsx(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap inline-block",
                      STATUS_BADGE[u.status],
                    )}
                  >
                    {STATUS_LABEL[u.status]}
                  </span>
                  {u.status === "SUSPENDED" && u.suspendedUntil && (
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      Đến {formatDateTime(u.suspendedUntil)}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {u.joinedAt}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={(e) =>
                      setMenuAnchor(
                        menuAnchor?.id === u.id
                          ? null
                          : { id: u.id, el: e.currentTarget },
                      )
                    }
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    <MoreVertical size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {menuAnchor && activeUser && (
        <UserActionsMenu
          user={activeUser}
          anchorEl={menuAnchor.el}
          onClose={() => setMenuAnchor(null)}
          onLock={() => {
            setMenuAnchor(null);
            onLock(activeUser);
          }}
          onUnlock={() => {
            setMenuAnchor(null);
            onUnlock(activeUser);
          }}
        />
      )}
    </div>
  );
}
