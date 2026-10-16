"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Home, BookOpen, MessageCircle, Bell, HelpCircle } from "lucide-react";
import { clsx } from "clsx";
import { useUnreadNotifCount } from "@/lib/notifications/hooks";
import { useUnreadChatCount } from "@/lib/chat/hooks";

export default function Sidebar({
  hideOnDesktop = false,
}: {
  hideOnDesktop?: boolean;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { count: unreadCount } = useUnreadNotifCount();
  const { count: chatUnread } = useUnreadChatCount(!!session?.user && !isAdmin);
  const t = useTranslations("nav");

  const navItems = [
    { href: "/feed", icon: Home, label: t("home") },
    { href: "/library", icon: BookOpen, label: t("library") },
    { href: "/chat", icon: MessageCircle, label: t("chat") },
    { href: "/notifications", icon: Bell, label: t("notifications") },
    { href: "/support", icon: HelpCircle, label: t("support") },
  ];

  const visibleNavItems = isAdmin
    ? navItems.filter((i) => i.href !== "/chat" && i.href !== "/notifications")
    : navItems;

  return (
    <aside
      className={clsx(
        "fixed z-20 bg-surface border-surface-200",
        "bottom-0 inset-x-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] border-t pb-safe",
        "md:inset-x-auto md:left-0 md:top-14 md:bottom-auto md:h-[calc(100dvh-56px)] md:w-[72px] md:border-t-0 md:border-r md:pb-0 md:overflow-y-auto",
        "lg:w-[330px]",
        hideOnDesktop && "md:hidden",
      )}
    >
      <nav className="flex h-full flex-row md:flex-col md:gap-0.5 md:p-3">
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
              title={item.label}
              className={clsx(
                "nav-item group relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                "md:flex-none md:py-2.5 md:rounded-lg",
                "lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm",
                isActive
                  ? "text-primary md:bg-primary/10"
                  : "text-text-secondary hover:text-text-primary md:hover:bg-surface-100",
              )}
            >
              <item.icon
                size={20}
                className={clsx(
                  isActive
                    ? "text-primary"
                    : "text-text-muted group-hover:text-text-primary",
                )}
              />
              <span className="md:hidden lg:inline lg:flex-1">
                {item.label}
              </span>
              {badge > 0 && (
                <span
                  className={clsx(
                    "bg-badge text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center",
                    "absolute top-1 left-1/2 ml-2",
                    "md:left-auto md:right-1 md:ml-0",
                    "lg:static lg:ml-0",
                  )}
                >
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
