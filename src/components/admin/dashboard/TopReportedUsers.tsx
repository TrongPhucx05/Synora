"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

type ReportedUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  reportCount: number;
};

export function TopReportedUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<ReportedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/top-reported-users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-4">
        Top người dùng bị báo cáo nhiều nhất
      </h3>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
                <div className="h-2.5 w-1/3 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
            <UserX size={16} className="text-slate-300" />
          </div>
          <p className="text-xs text-slate-400">
            Chưa có người dùng nào bị báo cáo
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => router.push(`/profile/${u.username}`)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Avatar
                src={u.avatarUrl ?? undefined}
                initials={u.name.slice(0, 2).toUpperCase()}
                size="sm"
                shape="circle"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">
                  {u.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  @{u.username}
                </p>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
                {u.reportCount} báo cáo
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
