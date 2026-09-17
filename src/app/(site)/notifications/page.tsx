"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { NotifRow } from "@/components/notifications/NotifRow";
import type { NotifItem } from "@/lib/notifications/types";
import { emitUnreadCount } from "@/lib/notifications/hooks";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("notifications.page");
  const tc = useTranslations("common");

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
    { id: "all", label: t("tabAll"), badge: totalUnread },
    { id: "unread", label: t("tabUnread"), badge: 0 },
    { id: "activity", label: t("tabActivity"), badge: unreadActivity },
    { id: "groups", label: t("tabGroups"), badge: unreadGroups },
    { id: "documents", label: t("tabDocuments"), badge: unreadDocs },
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
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              {t("title")}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">{t("subtitle")}</p>
          </div>
          <button
            onClick={markAllRead}
            disabled={totalUnread === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 px-3 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCheck size={13} />
            {t("markAllRead")}
          </button>
        </div>

        <div className="flex items-center gap-1 bg-surface rounded-xl border border-surface-200 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-text-muted hover:bg-surface-50"
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

        <div className="bg-surface rounded-2xl border border-surface-200 shadow-sm overflow-hidden divide-y divide-surface-100 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-2 text-text-muted">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">{tc("loading")}</span>
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-3">
              <Bell size={36} className="opacity-20" />
              <p className="text-sm">{t("empty")}</p>
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
                    className="px-5 py-2 text-sm font-semibold text-blue-500 dark:text-blue-400 border border-blue-200 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors"
                  >
                    {t("loadMore")}
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
