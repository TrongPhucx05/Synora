"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ThumbsUp,
  MessageSquare,
  AtSign,
  UserPlus,
  UserCheck,
  FileCheck,
  FileX,
  FileWarning,
  Bell,
  ShieldAlert,
  ShieldX,
  ShieldCheck,
  Flag,
  LifeBuoy,
} from "lucide-react";
import type { NotifItem, NotifType } from "@/lib/notifications/types";
import Avatar from "@/components/ui/Avatar";
import { useSession } from "next-auth/react";

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-teal-500",
];

const typeConfig: Record<NotifType, { icon: any; bg: string; color: string }> =
  {
    LIKE: { icon: ThumbsUp, bg: "bg-rose-50", color: "text-rose-500" },
    COMMENT: { icon: MessageSquare, bg: "bg-blue-50", color: "text-blue-500" },
    REPLY: { icon: MessageSquare, bg: "bg-blue-50", color: "text-blue-500" },
    MENTION: { icon: AtSign, bg: "bg-violet-50", color: "text-violet-500" },
    FRIEND_REQUEST: {
      icon: UserPlus,
      bg: "bg-emerald-50",
      color: "text-emerald-500",
    },
    FRIEND_ACCEPT: {
      icon: UserCheck,
      bg: "bg-emerald-50",
      color: "text-emerald-500",
    },
    DOCUMENT_APPROVED: {
      icon: FileCheck,
      bg: "bg-emerald-50",
      color: "text-emerald-500",
    },
    DOCUMENT_REJECTED: { icon: FileX, bg: "bg-red-50", color: "text-red-500" },
    DOCUMENT_REMOVED: { icon: FileX, bg: "bg-red-50", color: "text-red-500" },
    DOCUMENT_REPORTED: {
      icon: FileWarning,
      bg: "bg-amber-50",
      color: "text-amber-500",
    },
    FOLLOW: { icon: UserPlus, bg: "bg-emerald-50", color: "text-emerald-500" },
    MESSAGE: { icon: MessageSquare, bg: "bg-blue-50", color: "text-blue-500" },
    POST_REMOVED: { icon: FileX, bg: "bg-red-50", color: "text-red-500" },
    ACCOUNT_SUSPENDED: {
      icon: ShieldAlert,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
    ACCOUNT_BANNED: { icon: ShieldX, bg: "bg-red-50", color: "text-red-600" },
    ACCOUNT_UNLOCKED: {
      icon: ShieldCheck,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    SYSTEM: { icon: Bell, bg: "bg-slate-100", color: "text-slate-500" },
    REPORT_SUBMITTED: {
      icon: Flag,
      bg: "bg-orange-50",
      color: "text-orange-500",
    },
    REPORT_RESOLVED: {
      icon: ShieldCheck,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    REPORT_DISMISSED: {
      icon: ShieldAlert,
      bg: "bg-slate-100",
      color: "text-slate-500",
    },
    SUPPORT_REQUEST_SUBMITTED: {
      icon: LifeBuoy,
      bg: "bg-blue-50",
      color: "text-blue-500",
    },
  };

export function formatVietnameseTime(isoString: string) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  if (diffMins < 60) return `${diffMins || 1} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return new Date(isoString).toLocaleDateString("vi-VN");
}

export function NotifRow({
  notif,
  compact = false,
  onRead,
}: {
  notif: NotifItem;
  compact?: boolean;
  onRead?: (id: string) => void;
}) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">(
    "pending",
  );
  const [loading, setLoading] = useState(false);
  const { icon: Icon, bg, color } = typeConfig[notif.type] ?? typeConfig.SYSTEM;

  const resolvedColor = notif.avatarColors[0] ?? "bg-primary";

  const handleRequestAction = async (
    e: React.MouseEvent,
    action: "accept" | "reject",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!notif.requestId || loading || !session?.user?.username) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/profile/${session.user.username}/friend-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: notif.requestId, action }),
        },
      );
      if (res.ok) setStatus(action === "accept" ? "accepted" : "declined");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (notif.unread && onRead) onRead(notif.id);
  };

  return (
    <Link
      href={notif.href}
      onClick={handleClick}
      className={`group flex items-start gap-3 rounded-xl cursor-pointer transition-all duration-150 ${compact ? "px-3 py-2.5 hover:bg-slate-50" : "px-4 py-3.5 hover:bg-slate-50/80"} ${notif.unread ? "bg-blue-50/40 hover:bg-blue-50/60" : ""}`}
    >
      <div className="shrink-0 mt-0.5">
        {notif.avatars.length > 0 ? (
          <Avatar
            src={notif.avatarUrls?.[0] ?? null}
            name={notif.avatars[0]}
            initials={notif.avatars[0]}
            color={resolvedColor}
            size="sm"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}
          >
            <Icon size={15} className={color} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug text-slate-700 ${notif.unread ? "font-medium text-slate-900" : ""}`}
        >
          {notif.text}
        </p>
        {notif.sub && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{notif.sub}</p>
        )}
        <p
          className={`text-[11px] mt-1 ${notif.unread ? "text-blue-500 font-medium" : "text-slate-400"}`}
        >
          {formatVietnameseTime(notif.createdAt)}
        </p>

        {notif.action && !compact && (
          <div className="flex items-center gap-2 mt-2.5">
            {status === "accepted" ? (
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-lg">
                Đã chấp nhận
              </span>
            ) : status === "declined" ? (
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                Đã từ chối
              </span>
            ) : (
              <>
                <button
                  onClick={(e) => handleRequestAction(e, "accept")}
                  disabled={loading}
                  className="text-xs font-semibold text-white bg-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-70"
                >
                  {notif.action.accept}
                </button>
                <button
                  onClick={(e) => handleRequestAction(e, "reject")}
                  disabled={loading}
                  className="text-xs font-medium text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-70"
                >
                  {notif.action.decline}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {notif.unread && (
        <div className="shrink-0 mt-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full block" />
        </div>
      )}
    </Link>
  );
}
