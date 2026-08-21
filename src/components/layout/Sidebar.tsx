"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home,
  BookOpen,
  MessageCircle,
  Bell,
  HelpCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { useUnreadNotifCount } from "@/lib/notifications/hooks";
import { useUnreadChatCount } from "@/lib/chat/hooks";

const navItems = [
  { href: "/feed", icon: Home, label: "Trang chủ" },
  { href: "/library", icon: BookOpen, label: "Tài liệu" },
  { href: "/chat", icon: MessageCircle, label: "Nhắn tin" },
  { href: "/notifications", icon: Bell, label: "Thông báo" },
  { href: "/support", icon: HelpCircle, label: "Trợ giúp" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { count: unreadCount } = useUnreadNotifCount();
  const { count: chatUnread } = useUnreadChatCount(true);
  const visibleNavItems = isAdmin
    ? navItems.filter((i) => i.href !== "/chat" && i.href !== "/notifications")
    : navItems;

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-56px)] w-[330px] bg-white border-r border-surface-200 flex flex-col overflow-y-auto z-20">
      <nav className="flex flex-col gap-0.5 p-3">
        {visibleNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const badge =
            item.href === "/notifications"
              ? unreadCount
              : item.href === "/chat"
                ? chatUnread
                : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-surface-100 hover:text-text-primary",
              )}
            >
              <item.icon
                size={18}
                className={clsx(
                  isActive
                    ? "text-primary"
                    : "text-text-muted group-hover:text-text-primary",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="bg-primary text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
