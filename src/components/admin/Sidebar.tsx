"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileStack,
  Flag,
  UsersRound,
  Bell,
  BarChart3,
  ScrollText,
  ArrowLeft,
  LifeBuoy,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/users", icon: Users, label: "Người dùng" },
  { href: "/admin/content", icon: FileStack, label: "Nội dung" },
  {
    href: "/admin/reports",
    icon: Flag,
    label: "Báo cáo",
    countKey: "pendingReports",
  },
  {
    href: "/admin/support-requests",
    icon: LifeBuoy,
    label: "Yêu cầu hỗ trợ",
    countKey: "pendingSupportRequests",
  },
  { href: "/admin/groups", icon: UsersRound, label: "Nhóm" },
  { href: "/admin/notifications", icon: Bell, label: "Thông báo" },
  { href: "/admin/statistics", icon: BarChart3, label: "Thống kê" },
  { href: "/admin/audit-log", icon: ScrollText, label: "Nhật ký quản trị" },
] as const;

type Counts = { pendingReports: number; pendingSupportRequests: number };

export default function Sidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({
    pendingReports: 0,
    pendingSupportRequests: 0,
  });

  useEffect(() => {
    const load = () => {
      fetch("/api/admin/counts")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setCounts(data);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-slate-900 text-slate-300 flex flex-col z-30">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 2L14 5.5V12.5L9 16L4 12.5V5.5L9 2Z"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="9" cy="9" r="2" fill="white" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Synora</p>
          <p className="text-[10px] text-slate-400 leading-tight">
            Admin Panel
          </p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          const badgeCount =
            "countKey" in item ? counts[item.countKey as keyof Counts] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-500/15 text-blue-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
              )}
            >
              <item.icon size={17} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center shrink-0">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/feed"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={17} className="shrink-0" />
          Về trang chính
        </Link>
      </div>
    </aside>
  );
}
