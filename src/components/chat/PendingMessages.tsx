"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Inbox,
  Archive,
  X,
  MoreVertical,
  User,
  Ban,
  Trash2,
  Flag,
  Mail,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PillBadge, Badge } from "@/components/chat/Badge";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReportModal } from "@/components/ui/ReportModal";
import { useOutsideClickRefs } from "@/lib/chat/hooks";
import type { PendingConversation, Conversation } from "@/lib/chat/types";
import { blockUser } from "@/lib/block/utils";
import { clsx } from "clsx";
import {
  fetchPendingConversations,
  respondPendingConversation,
} from "@/lib/chat/utils";

type Tab = "pending" | "archived";

function formatTime(
  iso: string | null,
  t: ReturnType<typeof useTranslations>,
): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3_600_000)
    return t("time.minutes", { count: Math.floor(diff / 60_000) });
  if (diff < 86_400_000)
    return t("time.hours", { count: Math.floor(diff / 3_600_000) });
  if (diff < 172_800_000) return t("time.yesterday");
  return new Date(iso).toLocaleDateString();
}

export type OpenPendingPayload = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isGroup: boolean;
  otherUsername: string;
  otherUserId?: string;
  lastMessage: string;
  lastMessageAt: string | null;
  kind: "pending" | "archived";
};

function PendingItemMenu({
  username,
  isGroup,
  onClose,
  onBlock,
  onDelete,
  onReport,
}: {
  username: string;
  isGroup: boolean;
  onClose: () => void;
  onBlock: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClickRefs([ref], onClose);
  const t = useTranslations("chat.pending");
  const tc = useTranslations("common");
  const tl = useTranslations("chat.list");
  const tu = useTranslations("chat.utils");

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-20 w-44 bg-surface rounded-xl shadow-xl border border-surface-100 py-1 overflow-hidden"
    >
      {!isGroup && (
        <Link
          href={`/profile/${username}`}
          onClick={onClose}
          className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
        >
          <User size={13} className="text-text-muted shrink-0" />
          {tl("profile")}
        </Link>
      )}
      {!isGroup && (
        <button
          onClick={onBlock}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
        >
          <Ban size={13} className="text-text-muted shrink-0" />
          {tc("block")}
        </button>
      )}
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <Trash2 size={13} className="text-text-muted shrink-0" />
        {isGroup ? t("rejectInvite") : tc("delete")}
      </button>
      <div className="h-px bg-surface-100 my-0.5" />
      <button
        onClick={onReport}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
      >
        <Flag size={13} className="shrink-0" />
        {tc("report")}
      </button>
    </div>
  );
}

function ArchivedItemMenu({
  conv,
  onClose,
  onUnarchive,
  onMarkUnread,
  onDelete,
  onReport,
}: {
  conv: Conversation;
  onClose: () => void;
  onUnarchive: () => void;
  onMarkUnread: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClickRefs([ref], onClose);
  const t = useTranslations("chat.pending");
  const tc = useTranslations("common");
  const tl = useTranslations("chat.list");

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-20 w-48 bg-surface rounded-xl shadow-xl border border-surface-100 py-1 overflow-hidden"
    >
      {!conv.isSelf && (
        <button
          onClick={onMarkUnread}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
        >
          <Mail size={13} className="text-text-muted shrink-0" />
          {conv.unreadCount > 0 ? tl("markRead") : tl("markUnread")}
        </button>
      )}
      {!conv.isSelf && !conv.isGroup && conv.otherUsername && (
        <Link
          href={`/profile/${conv.otherUsername}`}
          onClick={onClose}
          className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
        >
          <User size={13} className="text-text-muted shrink-0" />
          {tl("profile")}
        </Link>
      )}
      <button
        onClick={onUnarchive}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <Archive size={13} className="text-text-muted shrink-0" />
        {t("unarchive")}
      </button>
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <Trash2 size={13} className="text-text-muted shrink-0" />
        {tc("delete")}
      </button>
      {!conv.isSelf && (
        <>
          <div className="h-px bg-surface-100 my-0.5" />
          <button
            onClick={onReport}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
          >
            <Flag size={13} className="shrink-0" />
            {tc("report")}
          </button>
        </>
      )}
    </div>
  );
}

export function PendingMessages({
  onOpen,
  onDeleted,
  onClose,
  onUnarchived,
  onMarkUnread,
  refreshKey,
  closeDrawerSignal,
}: {
  onOpen?: (conv: OpenPendingPayload) => void;
  onDeleted?: (conversationId: string) => void;
  onClose?: () => void;
  onUnarchived?: (conversationId: string) => void;
  onMarkUnread?: (conversationId: string, isCurrentlyUnread: boolean) => void;
  refreshKey?: number;
  closeDrawerSignal?: number;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<PendingConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [archivedItems, setArchivedItems] = useState<Conversation[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedMenuOpenId, setArchivedMenuOpenId] = useState<string | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<
    | { type: "deletePending"; id: string; name: string }
    | { type: "deleteArchived"; conv: Conversation }
    | { type: "unarchive"; conv: Conversation }
    | { type: "block"; id: string; senderId: string; name: string }
    | null
  >(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [reportingUser, setReportingUser] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const t = useTranslations("chat.pending");
  const tc = useTranslations("common");
  const tu = useTranslations("chat.utils");
  const tTime = useTranslations("chat.time");

  const load = () => {
    setLoading(true);
    fetchPendingConversations(tu)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (refreshKey === undefined) return;
    load();
  }, [refreshKey]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const isFirstCloseSignal = useRef(true);

  useEffect(() => {
    if (closeDrawerSignal === undefined) return;
    if (isFirstCloseSignal.current) {
      isFirstCloseSignal.current = false;
      return;
    }
    setOpen(false);
  }, [closeDrawerSignal]);

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await respondPendingConversation(id, "reject", tu);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setMenuOpenId(null);
      onDeleted?.(id);
    } catch {
      showToast(t("toast.cannotDeletePending"), "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const loadArchived = () => {
    setArchivedLoading(true);
    fetch("/api/conversations?archived=true")
      .then((r) => r.json())
      .then(setArchivedItems)
      .catch(() => setArchivedItems([]))
      .finally(() => setArchivedLoading(false));
  };

  const handleUnarchive = async (conv: Conversation) => {
    try {
      await fetch(`/api/conversations/${conv.id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      setArchivedItems((prev) => prev.filter((c) => c.id !== conv.id));
      onUnarchived?.(conv.id);
    } catch {
      showToast(t("toast.cannotUnarchive"), "error");
    }
  };

  const handleArchivedDelete = async (conv: Conversation) => {
    try {
      const res = await fetch(`/api/conversations/${conv.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? t("toast.cannotDelete"));
      setArchivedItems((prev) => prev.filter((c) => c.id !== conv.id));
      onDeleted?.(conv.id);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("toast.cannotDelete"),
        "error",
      );
    }
  };

  const handleArchivedToggleRead = (conv: Conversation) => {
    const isCurrentlyUnread = conv.unreadCount > 0;
    setArchivedItems((prev) =>
      prev.map((c) =>
        c.id === conv.id
          ? {
              ...c,
              unreadCount: isCurrentlyUnread ? 0 : Math.max(c.unreadCount, 1),
            }
          : c,
      ),
    );
    onMarkUnread?.(conv.id, isCurrentlyUnread);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      if (confirmAction.type === "deletePending") {
        await handleDelete(confirmAction.id);
      } else if (confirmAction.type === "deleteArchived") {
        await handleArchivedDelete(confirmAction.conv);
      } else if (confirmAction.type === "unarchive") {
        await handleUnarchive(confirmAction.conv);
      } else {
        await handleBlockUser(confirmAction.senderId, confirmAction.id);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const handleBlockUser = async (senderId: string, pendingId: string) => {
    try {
      await blockUser(senderId);
      setItems((prev) => prev.filter((i) => i.id !== pendingId));
      onDeleted?.(pendingId);
      showToast(t("toast.blockedUser"), "success");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : t("toast.cannotBlockUser"),
        "error",
      );
    }
  };

  const handleReport = (senderId: string, senderUsername: string) => {
    setMenuOpenId(null);
    setReportingUser({ id: senderId, username: senderUsername });
  };

  const handleOpenConversation = (msg: PendingConversation) => {
    onOpen?.({
      id: msg.id,
      name: msg.sender,
      avatarUrl: msg.avatarUrl,
      isGroup: msg.isGroup,
      otherUsername: msg.senderUsername,
      otherUserId: msg.isGroup ? undefined : msg.senderId,
      lastMessage: msg.content ?? "",
      lastMessageAt: msg.createdAt,
      kind: "pending",
    });
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          load();
        }}
        className="w-9 h-9 rounded-xl bg-surface-100 hover:bg-primary/10 flex items-center justify-center text-text-muted hover:text-primary transition-colors relative"
        title={t("title")}
      >
        <Clock size={16} />
        {items.length > 0 && (
          <PillBadge
            count={items.length}
            variant="pending"
            className="absolute -top-1.5 -right-1.5"
          />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-y-0 left-0 z-50 flex flex-col bg-surface shadow-2xl border-r border-surface-200 animate-slide-in-left"
          style={{ width: "320px" }}
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-surface-100 shrink-0">
            <div>
              <p className="text-sm font-bold text-text-primary">
                {t("title")}
              </p>
              {items.length > 0 && (
                <p className="text-[11px] text-text-muted mt-0.5">
                  {t("pendingRequestsCount", { count: items.length })}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onClose?.();
              }}
              className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors text-text-muted hover:text-text-primary"
              aria-label={tc("close")}
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-1.5 px-4 py-2.5 border-b border-surface-100 shrink-0">
            <button
              onClick={() => setTab("pending")}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
                tab === "pending"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-100 text-text-muted hover:bg-surface-200",
              )}
            >
              <Clock size={11} />
              {t("tabPending")}
              {items.length > 0 && (
                <span
                  className={clsx(
                    "ml-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                    tab === "pending"
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-200 text-text-muted",
                  )}
                >
                  {items.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setTab("archived");
                loadArchived();
              }}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
                tab === "archived"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-100 text-text-muted hover:bg-surface-200",
              )}
            >
              <Archive size={11} />
              {t("tabArchived")}
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {tab === "pending" && (
              <>
                {loading ? (
                  <div className="flex flex-col gap-0 p-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-2 py-3.5 animate-pulse"
                      >
                        <div className="w-10 h-10 rounded-full bg-surface-200 shrink-0" />
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="h-2.5 bg-surface-200 rounded-full w-2/3" />
                          <div className="h-2 bg-surface-200 rounded-full w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3 text-text-muted px-6">
                    <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
                      <Inbox size={22} className="opacity-50" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-text-secondary">
                        {t("emptyTitle")}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {t("emptyDesc")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {items.map((msg) => {
                      const isActioning = actionLoadingId === msg.id;
                      const menuOpen = menuOpenId === msg.id;
                      return (
                        <div
                          key={msg.id}
                          onClick={() => handleOpenConversation(msg)}
                          className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-50 transition-colors cursor-pointer border-b border-surface-50 last:border-b-0 group relative"
                        >
                          <div className="shrink-0">
                            <Avatar
                              src={msg.avatarUrl}
                              initials={msg.sender.slice(0, 2).toUpperCase()}
                              size="md"
                              shape="circle"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-xs font-bold text-text-primary truncate">
                                {msg.sender}
                              </p>
                              <span className="text-[10px] text-text-muted shrink-0 ml-2">
                                {formatTime(msg.createdAt, tTime)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] text-text-muted truncate flex-1">
                                {msg.content ??
                                  (msg.isGroup
                                    ? t("groupInviteFallback", {
                                        name: msg.sender,
                                      })
                                    : t("dmRequestFallback", {
                                        name: msg.sender,
                                      }))}
                              </p>
                              {msg.messageCount > 1 && (
                                <Badge
                                  count={msg.messageCount}
                                  variant="unread"
                                  size="md"
                                  className="shrink-0"
                                />
                              )}
                            </div>
                          </div>

                          <div
                            className="relative shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() =>
                                setMenuOpenId(menuOpen ? null : msg.id)
                              }
                              disabled={isActioning}
                              className="p-1.5 rounded-full hover:bg-surface-200 text-text-muted transition-colors disabled:opacity-50"
                            >
                              <MoreVertical size={15} />
                            </button>
                            {menuOpen && (
                              <PendingItemMenu
                                username={msg.senderUsername}
                                isGroup={msg.isGroup}
                                onClose={() => setMenuOpenId(null)}
                                onBlock={() => {
                                  setMenuOpenId(null);
                                  setConfirmAction({
                                    type: "block",
                                    id: msg.id,
                                    senderId: msg.senderId,
                                    name: msg.sender,
                                  });
                                }}
                                onDelete={() =>
                                  setConfirmAction({
                                    type: "deletePending",
                                    id: msg.id,
                                    name: msg.sender,
                                  })
                                }
                                onReport={() =>
                                  handleReport(msg.senderId, msg.senderUsername)
                                }
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {tab === "archived" && (
              <>
                {archivedLoading ? (
                  <div className="flex flex-col gap-0 p-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-2 py-3.5 animate-pulse"
                      >
                        <div className="w-10 h-10 rounded-full bg-surface-200 shrink-0" />
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="h-2.5 bg-surface-200 rounded-full w-2/3" />
                          <div className="h-2 bg-surface-200 rounded-full w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : archivedItems.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3 text-text-muted px-6">
                    <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
                      <Archive size={22} className="opacity-50" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-text-secondary">
                        {t("archivedEmptyTitle")}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {t("archivedEmptyDesc")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {archivedItems.map((conv) => {
                      const menuOpen = archivedMenuOpenId === conv.id;
                      return (
                        <div
                          key={conv.id}
                          onClick={() => {
                            onOpen?.({
                              id: conv.id,
                              name: conv.name,
                              avatarUrl: conv.avatarUrl,
                              isGroup: conv.isGroup,
                              otherUsername: conv.otherUsername ?? "",
                              otherUserId: conv.otherUserId,
                              lastMessage: conv.lastMessage,
                              lastMessageAt: conv.lastMessageAt,
                              kind: "archived",
                            });
                          }}
                          className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-50 transition-colors cursor-pointer border-b border-surface-50 last:border-b-0 group relative"
                        >
                          <Avatar
                            src={conv.avatarUrl ?? undefined}
                            initials={conv.name.slice(0, 2).toUpperCase()}
                            size="md"
                            shape="circle"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-xs font-bold text-text-primary truncate">
                                {conv.name}
                              </p>
                              <span className="text-[10px] text-text-muted shrink-0 ml-1">
                                {formatTime(conv.lastMessageAt, tTime)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] text-text-muted truncate">
                                {conv.lastMessage}
                              </p>
                              {conv.unreadCount > 0 && !conv.lastMessageAt ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-1" />
                              ) : (
                                <Badge
                                  count={conv.unreadCount}
                                  variant="unread"
                                  size="md"
                                  className="ml-1"
                                />
                              )}
                            </div>
                          </div>
                          <div
                            className="relative shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() =>
                                setArchivedMenuOpenId(menuOpen ? null : conv.id)
                              }
                              className={clsx(
                                "p-1.5 rounded-full hover:bg-surface-200 text-text-muted transition-colors",
                                menuOpen || "opacity-0 group-hover:opacity-100",
                              )}
                            >
                              <MoreVertical size={15} />
                            </button>
                            {menuOpen && (
                              <ArchivedItemMenu
                                conv={conv}
                                onClose={() => setArchivedMenuOpenId(null)}
                                onUnarchive={() => {
                                  setArchivedMenuOpenId(null);
                                  setConfirmAction({ type: "unarchive", conv });
                                }}
                                onMarkUnread={() => {
                                  setArchivedMenuOpenId(null);
                                  handleArchivedToggleRead(conv);
                                }}
                                onDelete={() => {
                                  setArchivedMenuOpenId(null);
                                  setConfirmAction({
                                    type: "deleteArchived",
                                    conv,
                                  });
                                }}
                                onReport={() => {
                                  setArchivedMenuOpenId(null);
                                  if (conv.otherUserId) {
                                    setReportingUser({
                                      id: conv.otherUserId,
                                      username: conv.otherUsername ?? conv.name,
                                    });
                                  }
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {confirmAction && (
        <ConfirmDialog
          icon={
            confirmAction.type === "unarchive" ? (
              <Archive size={20} className="text-primary" />
            ) : (
              <Trash2 size={20} className="text-red-500 dark:text-red-400" />
            )
          }
          iconBgClass={
            confirmAction.type === "unarchive"
              ? "bg-primary/10"
              : "bg-red-100 dark:bg-red-500/20"
          }
          title={
            confirmAction.type === "unarchive"
              ? t("confirm.unarchiveTitle")
              : confirmAction.type === "deletePending"
                ? t("confirm.deletePendingTitle")
                : confirmAction.type === "block"
                  ? t("confirm.blockTitle", { name: confirmAction.name })
                  : t("confirm.deleteConvTitle")
          }
          description={
            confirmAction.type === "unarchive" ? (
              t.rich("confirm.unarchiveDesc", {
                name: confirmAction.conv.name,
                b: (chunks) => (
                  <span className="font-medium text-text-secondary">{chunks}</span>
                ),
              })
            ) : confirmAction.type === "block" ? (
              t.rich("confirm.blockDesc", {
                name: confirmAction.name,
                b: (chunks) => (
                  <span className="font-medium text-text-secondary">{chunks}</span>
                ),
              })
            ) : (
              t.rich("confirm.deleteConvDesc", {
                name:
                  confirmAction.type === "deletePending"
                    ? confirmAction.name
                    : confirmAction.conv.name,
                b: (chunks) => (
                  <span className="font-medium text-text-secondary">{chunks}</span>
                ),
              })
            )
          }
          confirmLabel={
            confirmAction.type === "unarchive"
              ? t("unarchive")
              : confirmAction.type === "block"
                ? tc("block")
                : tc("delete")
          }
          confirmVariant={
            confirmAction.type === "unarchive" ? "primary" : "danger"
          }
          loading={confirmLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {reportingUser && (
        <ReportModal
          targetType="USER"
          targetId={reportingUser.id}
          title={t("reportTitle", { name: reportingUser.username })}
          onClose={() => setReportingUser(null)}
        />
      )}
    </>
  );
}