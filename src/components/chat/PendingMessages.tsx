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

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ`;
  if (diff < 172_800_000) return "Hôm qua";
  return new Date(iso).toLocaleDateString("vi-VN");
}

export type OpenPendingPayload = {
  id: string;
  name: string;
  avatarUrl: string | null;
  otherUsername: string;
  lastMessage: string;
  lastMessageAt: string | null;
  kind: "pending" | "archived";
};

function PendingItemMenu({
  username,
  onClose,
  onBlock,
  onDelete,
  onReport,
}: {
  username: string;
  onClose: () => void;
  onBlock: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClickRefs([ref], onClose);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-xl shadow-xl border border-surface-100 py-1 overflow-hidden"
    >
      <Link
        href={`/profile/${username}`}
        onClick={onClose}
        className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <User size={13} className="text-text-muted shrink-0" />
        Trang cá nhân
      </Link>
      <button
        onClick={onBlock}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <Ban size={13} className="text-text-muted shrink-0" />
        Chặn
      </button>
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <Trash2 size={13} className="text-text-muted shrink-0" />
        Xóa
      </button>
      <div className="h-px bg-surface-100 my-0.5" />
      <button
        onClick={onReport}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
      >
        <Flag size={13} className="shrink-0" />
        Báo cáo
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

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-xl shadow-xl border border-surface-100 py-1 overflow-hidden"
    >
      {!conv.isSelf && (
        <button
          onClick={onMarkUnread}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
        >
          <Mail size={13} className="text-text-muted shrink-0" />
          {conv.unreadCount > 0 ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
        </button>
      )}
      {!conv.isSelf && !conv.isGroup && conv.otherUsername && (
        <Link
          href={`/profile/${conv.otherUsername}`}
          onClick={onClose}
          className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
        >
          <User size={13} className="text-text-muted shrink-0" />
          Trang cá nhân
        </Link>
      )}
      <button
        onClick={onUnarchive}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <Archive size={13} className="text-text-muted shrink-0" />
        Bỏ lưu trữ
      </button>
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <Trash2 size={13} className="text-text-muted shrink-0" />
        Xóa
      </button>
      {!conv.isSelf && (
        <>
          <div className="h-px bg-surface-100 my-0.5" />
          <button
            onClick={onReport}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
          >
            <Flag size={13} className="shrink-0" />
            Báo cáo
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

  const load = () => {
    setLoading(true);
    fetchPendingConversations()
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
      await respondPendingConversation(id, "reject");
      setItems((prev) => prev.filter((i) => i.id !== id));
      setMenuOpenId(null);
      onDeleted?.(id);
    } catch {
      showToast("Không thể xóa tin nhắn chờ", "error");
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
      showToast("Không thể bỏ lưu trữ", "error");
    }
  };

  const handleArchivedDelete = async (conv: Conversation) => {
    try {
      const res = await fetch(`/api/conversations/${conv.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Có lỗi xảy ra");
      setArchivedItems((prev) => prev.filter((c) => c.id !== conv.id));
      onDeleted?.(conv.id);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Không thể xóa", "error");
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
      showToast("Đã chặn người dùng", "success");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Không thể chặn người dùng",
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
      otherUsername: msg.senderUsername,
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
        title="Tin nhắn chờ"
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
          className="fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-2xl border-r border-surface-200 animate-slide-in-left"
          style={{ width: "320px" }}
          role="dialog"
          aria-modal="true"
          aria-label="Tin nhắn chờ"
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-surface-100 shrink-0">
            <div>
              <p className="text-sm font-bold text-text-primary">
                Tin nhắn chờ
              </p>
              {items.length > 0 && (
                <p className="text-[11px] text-text-muted mt-0.5">
                  {items.length} yêu cầu đang chờ
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onClose?.();
              }}
              className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors text-text-muted hover:text-text-primary"
              aria-label="Đóng"
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
              Chờ
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
              Lưu trữ
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
                        Không có tin nhắn chờ
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Các yêu cầu trò chuyện mới sẽ hiển thị ở đây
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
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] text-text-muted truncate flex-1">
                                {msg.content ??
                                  `${msg.sender} muốn trò chuyện với bạn`}
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
                        Chưa có tin nhắn lưu trữ
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Các cuộc trò chuyện đã lưu trữ sẽ hiển thị ở đây
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
                              otherUsername: conv.otherUsername ?? "",
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
                                {formatTime(conv.lastMessageAt)}
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
              <Trash2 size={20} className="text-red-500" />
            )
          }
          iconBgClass={
            confirmAction.type === "unarchive" ? "bg-primary/10" : "bg-red-100"
          }
          title={
            confirmAction.type === "unarchive"
              ? "Bỏ lưu trữ cuộc trò chuyện?"
              : confirmAction.type === "deletePending"
                ? "Xóa tin nhắn chờ?"
                : confirmAction.type === "block"
                  ? `Chặn ${confirmAction.name}?`
                  : "Xóa cuộc trò chuyện?"
          }
          description={
            confirmAction.type === "unarchive" ? (
              <>
                Cuộc trò chuyện với{" "}
                <span className="font-medium text-text-secondary">
                  {confirmAction.conv.name}
                </span>{" "}
                sẽ được chuyển về danh sách tin nhắn chính.
              </>
            ) : confirmAction.type === "block" ? (
              <>
                <span className="font-medium text-text-secondary">
                  {confirmAction.name}
                </span>{" "}
                sẽ không thể nhắn tin, xem trang cá nhân hoặc kết bạn với bạn
                nữa.
              </>
            ) : (
              <>
                Toàn bộ tin nhắn với{" "}
                <span className="font-medium text-text-secondary">
                  {confirmAction.type === "deletePending"
                    ? confirmAction.name
                    : confirmAction.conv.name}
                </span>{" "}
                sẽ bị xóa. Không thể hoàn tác.
              </>
            )
          }
          confirmLabel={
            confirmAction.type === "unarchive"
              ? "Bỏ lưu trữ"
              : confirmAction.type === "block"
                ? "Chặn"
                : "Xóa"
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
          title={`Báo cáo ${reportingUser.username}`}
          onClose={() => setReportingUser(null)}
        />
      )}
    </>
  );
}
