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
  Users,
  UserCog,
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
    LIKE: {
      icon: ThumbsUp,
      bg: "bg-rose-50 dark:bg-rose-500/15",
      color: "text-rose-500 dark:text-rose-400",
    },
    COMMENT: {
      icon: MessageSquare,
      bg: "bg-blue-50 dark:bg-blue-500/15",
      color: "text-blue-500 dark:text-blue-400",
    },
    REPLY: {
      icon: MessageSquare,
      bg: "bg-blue-50 dark:bg-blue-500/15",
      color: "text-blue-500 dark:text-blue-400",
    },
    MENTION: {
      icon: AtSign,
      bg: "bg-violet-50 dark:bg-violet-500/15",
      color: "text-violet-500 dark:text-violet-400",
    },
    FRIEND_REQUEST: {
      icon: UserPlus,
      bg: "bg-emerald-50 dark:bg-emerald-500/15",
      color: "text-emerald-500 dark:text-emerald-400",
    },
    FRIEND_ACCEPT: {
      icon: UserCheck,
      bg: "bg-emerald-50 dark:bg-emerald-500/15",
      color: "text-emerald-500 dark:text-emerald-400",
    },
    DOCUMENT_APPROVED: {
      icon: FileCheck,
      bg: "bg-emerald-50 dark:bg-emerald-500/15",
      color: "text-emerald-500 dark:text-emerald-400",
    },
    DOCUMENT_REJECTED: {
      icon: FileX,
      bg: "bg-red-50 dark:bg-red-500/15",
      color: "text-red-500 dark:text-red-400",
    },
    DOCUMENT_REMOVED: {
      icon: FileX,
      bg: "bg-red-50 dark:bg-red-500/15",
      color: "text-red-500 dark:text-red-400",
    },
    DOCUMENT_REPORTED: {
      icon: FileWarning,
      bg: "bg-amber-50 dark:bg-amber-500/15",
      color: "text-amber-500 dark:text-amber-400",
    },
    FOLLOW: {
      icon: UserPlus,
      bg: "bg-emerald-50 dark:bg-emerald-500/15",
      color: "text-emerald-500 dark:text-emerald-400",
    },
    MESSAGE: {
      icon: MessageSquare,
      bg: "bg-blue-50 dark:bg-blue-500/15",
      color: "text-blue-500 dark:text-blue-400",
    },
    POST_REMOVED: {
      icon: FileX,
      bg: "bg-red-50 dark:bg-red-500/15",
      color: "text-red-500 dark:text-red-400",
    },
    ACCOUNT_SUSPENDED: {
      icon: ShieldAlert,
      bg: "bg-amber-50 dark:bg-amber-500/15",
      color: "text-amber-600 dark:text-amber-400",
    },
    ACCOUNT_BANNED: {
      icon: ShieldX,
      bg: "bg-red-50 dark:bg-red-500/15",
      color: "text-red-600 dark:text-red-400",
    },
    ACCOUNT_UNLOCKED: {
      icon: ShieldCheck,
      bg: "bg-emerald-50 dark:bg-emerald-500/15",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    SYSTEM: { icon: Bell, bg: "bg-surface-100", color: "text-text-muted" },
    REPORT_SUBMITTED: {
      icon: Flag,
      bg: "bg-orange-50 dark:bg-orange-500/15",
      color: "text-orange-500 dark:text-orange-400",
    },
    REPORT_RESOLVED: {
      icon: ShieldCheck,
      bg: "bg-emerald-50 dark:bg-emerald-500/15",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    REPORT_DISMISSED: {
      icon: ShieldAlert,
      bg: "bg-surface-100",
      color: "text-text-muted",
    },
    SUPPORT_REQUEST_SUBMITTED: {
      icon: LifeBuoy,
      bg: "bg-blue-50 dark:bg-blue-500/15",
      color: "text-blue-500 dark:text-blue-400",
    },
    SUPPORT_REQUEST_UPDATED: {
      icon: LifeBuoy,
      bg: "bg-emerald-50 dark:bg-emerald-500/15",
      color: "text-emerald-500 dark:text-emerald-400",
    },
    GROUP_INVITE: {
      icon: Users,
      bg: "bg-indigo-50 dark:bg-indigo-500/15",
      color: "text-indigo-500 dark:text-indigo-400",
    },
    GROUP_JOIN_REQUEST: {
      icon: UserCog,
      bg: "bg-amber-50 dark:bg-amber-500/15",
      color: "text-amber-500 dark:text-amber-400",
    },
    GROUP_JOIN_APPROVED: {
      icon: UserCheck,
      bg: "bg-emerald-50 dark:bg-emerald-500/15",
      color: "text-emerald-500 dark:text-emerald-400",
    },
    GROUP_JOIN_REJECTED: {
      icon: UserPlus,
      bg: "bg-surface-100",
      color: "text-text-muted",
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
    if (loading) return;

    if (notif.type === "FRIEND_REQUEST") {
      if (!notif.requestId || !session?.user?.username) return;
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
      return;
    }

    if (notif.type === "GROUP_JOIN_REQUEST") {
      if (!notif.conversationId || !notif.actorId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/conversations/${notif.conversationId}/join-requests/${notif.actorId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: action === "accept" ? "approve" : "reject",
            }),
          },
        );
        if (res.ok) setStatus(action === "accept" ? "accepted" : "declined");
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const handleClick = () => {
    if (notif.unread && onRead) onRead(notif.id);
  };

  return (
    <Link
      href={notif.href}
      onClick={handleClick}
      className={`group flex items-start gap-3 rounded-xl cursor-pointer transition-all duration-150 ${compact ? "px-3 py-2.5 hover:bg-surface-50" : "px-4 py-3.5 hover:bg-surface-50"} ${notif.unread ? "bg-blue-50/40 dark:bg-blue-500/10 hover:bg-blue-50/60 dark:hover:bg-blue-500/15" : ""}`}
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
          className={`text-sm leading-snug text-text-secondary ${notif.unread ? "font-medium text-text-primary" : ""}`}
        >
          {notif.text}
        </p>
        {notif.sub && (
          <p className="text-xs text-text-muted mt-0.5 truncate">{notif.sub}</p>
        )}
        <p
          className={`text-[11px] mt-1 ${notif.unread ? "text-blue-500 dark:text-blue-400 font-medium" : "text-text-muted"}`}
        >
          {formatVietnameseTime(notif.createdAt)}
        </p>

        {notif.action && !compact && (
          <div className="flex items-center gap-2 mt-2.5">
            {status === "accepted" ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/15 px-3 py-1 rounded-lg">
                {notif.type === "GROUP_JOIN_REQUEST"
                  ? "Đã duyệt"
                  : "Đã chấp nhận"}
              </span>
            ) : status === "declined" ? (
              <span className="text-xs text-text-muted bg-surface-100 px-3 py-1 rounded-lg">
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
                  className="text-xs font-medium text-text-muted border border-surface-200 px-3 py-1.5 rounded-lg hover:bg-surface-100 transition-colors disabled:opacity-70"
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
