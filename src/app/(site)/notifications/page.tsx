"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { NotifRow } from "@/components/notifications/NotifRow";
import type { NotifItem } from "@/lib/notifications/types";
import { emitUnreadCount } from "@/lib/notifications/hooks";

const ACTIVITY_TYPES = [
  "FRIEND_REQUEST",
  "FRIEND_ACCEPT",
  "LIKE",
  "COMMENT",
  "REPLY",
  "MENTION",
];
const DOCUMENT_TYPES = [
  "DOCUMENT_REPORTED",
  "DOCUMENT_APPROVED",
  "DOCUMENT_REJECTED",
  "DOCUMENT_REMOVED",
];
const GROUP_TYPES = [
  "GROUP_INVITE",
  "GROUP_JOIN_REQUEST",
  "GROUP_JOIN_APPROVED",
  "GROUP_JOIN_REJECTED",
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifs(data.items ?? []);
        setNextCursor(data.nextCursor ?? null);
        setTotalUnread(data.totalUnread ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    emitUnreadCount(totalUnread);
  }, [totalUnread]);

  const loadMore = async () => {
    if (!nextCursor) return;
    const res = await fetch(`/api/notifications?cursor=${nextCursor}`);
    const data = await res.json();
    setNotifs((prev) => [...prev, ...(data.items ?? [])]);
    setNextCursor(data.nextCursor ?? null);
  };

  const markRead = useCallback((id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
    setTotalUnread((prev) => Math.max(0, prev - 1));
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }, []);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    setTotalUnread(0);
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  };

  const unreadActivity = notifs.filter(
    (n) => n.unread && ACTIVITY_TYPES.includes(n.type),
  ).length;
  const unreadDocs = notifs.filter(
    (n) => n.unread && DOCUMENT_TYPES.includes(n.type),
  ).length;
  const unreadGroups = notifs.filter(
    (n) => n.unread && GROUP_TYPES.includes(n.type),
  ).length;

  const tabs = [
    { id: "all", label: "Tất cả", badge: totalUnread },
    { id: "unread", label: "Chưa đọc", badge: 0 },
    { id: "activity", label: "Hoạt động", badge: unreadActivity },
    { id: "groups", label: "Nhóm", badge: unreadGroups },
    { id: "documents", label: "Tài liệu", badge: unreadDocs },
  ];

  const filteredNotifs = notifs.filter((n) => {
    if (activeTab === "unread") return n.unread;
    if (activeTab === "activity") return ACTIVITY_TYPES.includes(n.type);
    if (activeTab === "documents") return DOCUMENT_TYPES.includes(n.type);
    if (activeTab === "groups") return GROUP_TYPES.includes(n.type);
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-12">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Thông báo
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">30 ngày gần nhất</p>
          </div>
          <button
            onClick={markAllRead}
            disabled={totalUnread === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCheck size={13} />
            Đọc tất cả
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center text-[9px] font-bold rounded-full px-1 min-w-[14px] h-[14px] leading-none ${
                    activeTab === tab.id
                      ? "bg-white/30 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <Bell size={36} className="opacity-20" />
              <p className="text-sm">Không có thông báo phù hợp</p>
            </div>
          ) : (
            <>
              {filteredNotifs.map((notif) => (
                <NotifRow key={notif.id} notif={notif} onRead={markRead} />
              ))}
              {nextCursor && (
                <div className="flex justify-center p-3">
                  <button
                    onClick={loadMore}
                    className="px-5 py-2 text-sm font-semibold text-blue-500 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Xem thêm
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
