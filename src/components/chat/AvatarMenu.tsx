"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Bell,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { clsx } from "clsx";
import { useSession, signOut } from "next-auth/react";
import { useOutsideClick } from "@/lib/chat/hooks";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import Avatar from "@/components/ui/Avatar";
import { PillBadge } from "./Badge";
import { getColorForUser, getInitialsFromName } from "@/lib/chat/utils";
import type { AvatarMenuPanel } from "@/lib/chat/types";
import { useSyncedBoolean } from "@/lib/settings/hooks";

export function AvatarMenu() {
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name ?? user?.username ?? "?";
  const avatarUrl = user?.image ?? null;
  const initials = getInitialsFromName(displayName);
  const color = getColorForUser(user?.id ?? "");
  const {
    value: showActivity,
    loading: loadingActivity,
    toggle: toggleActivity,
  } = useSyncedBoolean({
    key: "activityStatus",
    apiPath: "/api/settings/activity-status",
    field: "showActivityStatus",
  });

  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<AvatarMenuPanel>("main");
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => {
    setOpen(false);
    setPanel("main");
  });

  const closeMenu = () => {
    setOpen(false);
    setPanel("main");
  };

  return (
    <div ref={ref} className="relative w-full flex flex-col items-center">
      <button
        onClick={() => {
          setOpen((v) => !v);
          setPanel("main");
        }}
        className={clsx(
          "rounded-full transition-all",
          open
            ? "ring-2 ring-primary/40 ring-offset-1"
            : "hover:ring-2 hover:ring-primary/20 hover:ring-offset-1",
        )}
      >
        <Avatar
          src={avatarUrl}
          initials={initials}
          color={color}
          size="sm"
          shape="circle"
        />
      </button>

      {open && (
        <div className="absolute left-full bottom-0 ml-2 w-64 bg-surface rounded-2xl shadow-xl border border-surface-200 overflow-hidden z-50">
          {panel === "main" && (
            <>
              <div className="px-4 py-3.5 border-b border-surface-100 flex items-center gap-3">
                <Avatar
                  src={avatarUrl}
                  initials={initials}
                  color={color}
                  size="md"
                  shape="circle"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-0.5 font-medium">
                    ● Đang hoạt động
                  </p>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href={`/profile/${user?.username}`}
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
                >
                  <User size={14} className="text-text-muted shrink-0" />
                  Trang cá nhân
                </Link>
                <button
                  onClick={() => setPanel("settings")}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
                >
                  <Settings size={14} className="text-text-muted shrink-0" />
                  Cài đặt
                  <ChevronRight size={12} className="text-text-muted ml-auto" />
                </button>

                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors">
                  <HelpCircle size={14} className="text-text-muted shrink-0" />
                  Trợ giúp
                </button>
              </div>

              <div className="border-t border-surface-100 py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={14} className="shrink-0" />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
          {panel === "settings" && (
            <>
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-surface-100">
                <button
                  onClick={() => setPanel("main")}
                  className="p-1 hover:bg-surface-100 rounded-lg transition-colors text-text-muted"
                >
                  <ArrowLeft size={14} />
                </button>
                <p className="text-sm font-bold text-text-primary">Cài đặt</p>
              </div>
              <div className="py-2">
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-500/15 flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary">
                      Trạng thái hoạt động
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Cho bạn bè thấy bạn đang online
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={showActivity}
                    disabled={loadingActivity}
                    onChange={() => {
                      toggleActivity().catch(() => {});
                    }}
                  />
                </div>
                <div className="h-px bg-surface-100 my-1 mx-4" />
                {[
                  {
                    label: "Thông báo đẩy",
                    desc: "Nhận thông báo tin nhắn mới",
                    icon: <Bell size={13} className="text-primary" />,
                    val: true,
                  },
                  {
                    label: "Âm thanh",
                    desc: "Phát âm khi có tin nhắn",
                    icon: <Bell size={13} className="text-amber-500 dark:text-amber-400" />,
                    val: true,
                  },
                  {
                    label: "Xem trước tin nhắn",
                    desc: "Hiện nội dung ở thông báo",
                    icon: <MessageSquare size={13} className="text-teal-500 dark:text-teal-400" />,
                    val: false,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-text-muted">{item.desc}</p>
                    </div>
                    <ToggleSwitch checked={item.val} onChange={() => {}} />
                  </div>
                ))}
                <div className="h-px bg-surface-100 my-1 mx-4" />
                {[
                  { label: "Ngôn ngữ", value: "Tiếng Việt" },
                  { label: "Chủ đề", value: "Sáng" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
                      <Settings size={13} className="text-text-muted" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-text-primary">
                        {item.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-text-muted">
                        {item.value}
                      </span>
                      <ChevronRight size={12} className="text-text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
