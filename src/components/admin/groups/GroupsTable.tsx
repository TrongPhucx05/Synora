"use client";
import { Users as UsersIcon, Flag } from "lucide-react";
import { clsx } from "clsx";
import Avatar from "@/components/ui/Avatar";
import { GroupActionsMenu } from "./GroupActionsMenu";
import type { AdminGroupRow } from "@/lib/admin/groups/types";

const STATUS_BADGE: Record<AdminGroupRow["status"], string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600",
  DISABLED: "bg-red-50 text-red-600",
};

const STATUS_LABEL: Record<AdminGroupRow["status"], string> = {
  ACTIVE: "Đang hoạt động",
  DISABLED: "Đã vô hiệu hóa",
};

export function GroupsTable({
  groups,
  onViewDetail,
  onDisable,
  onEnable,
  onDelete,
}: {
  groups: AdminGroupRow[];
  onViewDetail: (g: AdminGroupRow) => void;
  onDisable: (g: AdminGroupRow) => void;
  onEnable: (g: AdminGroupRow) => void;
  onDelete: (g: AdminGroupRow) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl py-16 flex items-center justify-center">
        <p className="text-sm text-slate-400">Không tìm thấy nhóm chat nào</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left font-semibold text-slate-500 text-xs px-5 py-3">
              Nhóm
            </th>
            <th className="text-left font-semibold text-slate-500 text-xs px-4 py-3">
              Trưởng nhóm
            </th>
            <th className="text-left font-semibold text-slate-500 text-xs px-4 py-3">
              Thành viên
            </th>
            <th className="text-left font-semibold text-slate-500 text-xs px-4 py-3">
              Báo cáo
            </th>
            <th className="text-left font-semibold text-slate-500 text-xs px-4 py-3">
              Trạng thái
            </th>
            <th className="text-left font-semibold text-slate-500 text-xs px-4 py-3">
              Ngày tạo
            </th>
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr
              key={g.id}
              className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={g.avatarUrl ?? undefined}
                    initials={g.name.slice(0, 2).toUpperCase()}
                    size="sm"
                    shape="rounded"
                  />
                  <p className="text-xs font-medium text-slate-800 truncate max-w-[160px]">
                    {g.name}
                  </p>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-xs font-medium text-slate-700">
                  {g.leaderName}
                </p>
                <p className="text-[11px] text-slate-400">
                  @{g.leaderUsername}
                </p>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <UsersIcon size={13} className="text-slate-400" />
                  {g.acceptedMemberCount}/{g.memberCount}
                  {g.acceptedMemberCount < g.memberCount && (
                    <span className="text-[10px] text-amber-500">
                      ({g.memberCount - g.acceptedMemberCount} chờ)
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                {g.reportCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Flag size={11} /> {g.reportCount}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={clsx(
                    "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                    STATUS_BADGE[g.status],
                  )}
                >
                  {STATUS_LABEL[g.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {g.createdAt}
              </td>
              <td className="px-4 py-3">
                <GroupActionsMenu
                  group={g}
                  onViewDetail={() => onViewDetail(g)}
                  onDisable={() => onDisable(g)}
                  onEnable={() => onEnable(g)}
                  onDelete={() => onDelete(g)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
