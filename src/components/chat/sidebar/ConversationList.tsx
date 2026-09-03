"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  MoreVertical,
  Mail,
  User,
  Ban,
  Archive,
  Trash2,
  Flag,
  History,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import Avatar from "@/components/ui/Avatar";
import { Badge } from "@/components/chat/Badge";
import { useOutsideClickRefs } from "@/lib/chat/hooks";
import type { Conversation, FilterChip } from "@/lib/chat/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ`;
  if (diff < 172_800_000) return "Hôm qua";
  return new Date(iso).toLocaleDateString("vi-VN");
}

interface ConversationItemMenuProps {
  conversation: Conversation;
  onClose: () => void;
  onMarkUnread: () => void;
  onBlock: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onReport: () => void;
}

function ConversationItemMenu({
  conversation,
  onClose,
  onMarkUnread,
  onBlock,
  onArchive,
  onDelete,
  onReport,
}: ConversationItemMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClickRefs([ref], onClose);

  const { isSelf, isGroup } = conversation;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-20 w-48 bg-surface rounded-xl shadow-xl border border-surface-100 py-1 overflow-hidden"
    >
      {!isSelf && (
        <button
          onClick={onMarkUnread}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
        >
          <Mail size={13} className="text-text-muted shrink-0" />
          {conversation.unreadCount > 0
            ? "Đánh dấu đã đọc"
            : "Đánh dấu chưa đọc"}
        </button>
      )}
      {!isSelf && !isGroup && conversation.otherUsername && (
        <Link
          href={`/profile/${conversation.otherUsername}`}
          onClick={onClose}
          className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
        >
          <User size={13} className="text-text-muted shrink-0" />
          Trang cá nhân
        </Link>
      )}
      {!isSelf && !isGroup && (
        <button
          onClick={onBlock}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
        >
          <Ban size={13} className="text-text-muted shrink-0" />
          Chặn
        </button>
      )}
      <button
        onClick={onArchive}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <Archive size={13} className="text-text-muted shrink-0" />
        Lưu trữ
      </button>
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <Trash2 size={13} className="text-text-muted shrink-0" />
        Xóa
      </button>
      {!isSelf && (
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

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  searchQuery: string;
  activeFilter: FilterChip;
  totalUnread: number;
  loading?: boolean;
  onSelect: (id: string) => void;
  onSearchChange: (q: string) => void;
  onFilterChange: (f: FilterChip) => void;
  onMarkUnread: (id: string, isCurrentlyUnread: boolean) => void;
  onBlock: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  hiddenResults?: Conversation[];
  searchingHidden?: boolean;
  onSelectHidden?: (conv: Conversation) => void;
}

const FILTER_CHIPS: { key: FilterChip; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "group", label: "Nhóm" },
];

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  totalUnread,
  loading,
  onMarkUnread,
  onBlock,
  onArchive,
  onDelete,
  onReport,
  hiddenResults = [],
  searchingHidden = false,
  onSelectHidden,
}: ConversationListProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleDeleteClick = (conv: Conversation) => {
    onDelete(conv.id);
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="w-[268px] shrink-0 border-r border-surface-200 bg-surface flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-surface-100">
        <h2 className="text-base font-bold text-text-primary mb-3">Tin nhắn</h2>
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-8 pr-3 py-2 bg-surface-100 rounded-lg text-xs placeholder:text-text-muted focus:outline-none border border-transparent focus:border-primary focus:bg-surface transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-1.5 px-4 py-2.5 border-b border-surface-100">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => onFilterChange(chip.key)}
            className={clsx(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors",
              activeFilter === chip.key
                ? "bg-primary text-white"
                : "bg-surface-100 text-text-muted hover:bg-surface-200",
            )}
          >
            {chip.label}
            {chip.key === "unread" &&
              totalUnread > 0 &&
              activeFilter !== "unread" && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[9px] font-bold text-white bg-primary rounded-full">
                  {totalUnread}
                </span>
              )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-1 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-2 py-3 animate-pulse"
              >
                <div className="w-9 h-9 rounded-full bg-surface-200 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-2.5 bg-surface-200 rounded-full w-3/4" />
                  <div className="h-2 bg-surface-200 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 &&
          (!isSearching || hiddenResults.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 gap-2">
            <MessageSquare size={28} className="text-surface-300" />
            <p className="text-xs text-text-muted text-center">
              {activeFilter === "unread"
                ? "Không có tin nhắn chưa đọc"
                : activeFilter === "group"
                  ? "Không có nhóm nào"
                  : "Không tìm thấy cuộc trò chuyện"}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => onFilterChange("all")}
                className="text-[10px] text-primary font-semibold hover:underline"
              >
                Xem tất cả
              </button>
            )}
          </div>
        ) : (
          conversations.map((conv) => {
            const menuOpen = menuOpenId === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer group relative",
                  activeId === conv.id
                    ? "bg-primary/10"
                    : "hover:bg-surface-50",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={conv.avatarUrl ?? undefined}
                    initials={getInitials(conv.name)}
                    size="md"
                    shape="circle"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p
                        className={clsx(
                          "text-xs truncate",
                          conv.unreadCount > 0 ? "font-bold" : "font-semibold",
                          "text-text-primary",
                        )}
                      >
                        {conv.name}
                      </p>
                      {conv.isPending && (
                        <span className="shrink-0 text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          Chờ
                        </span>
                      )}
                    </div>
                    <span
                      className={clsx(
                        "text-[10px] shrink-0 ml-1",
                        conv.unreadCount > 0
                          ? "text-primary font-semibold"
                          : "text-text-muted",
                      )}
                    >
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={clsx(
                        "text-[11px] truncate",
                        conv.unreadCount > 0
                          ? "text-text-secondary font-medium"
                          : "text-text-muted",
                      )}
                    >
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
                    onClick={() => setMenuOpenId(menuOpen ? null : conv.id)}
                    className={clsx(
                      "p-1.5 rounded-full hover:bg-surface-200 text-text-muted transition-colors",
                      menuOpen && "bg-surface-200",
                      menuOpen || activeId === conv.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menuOpen && (
                    <ConversationItemMenu
                      conversation={conv}
                      onClose={() => setMenuOpenId(null)}
                      onMarkUnread={() => {
                        setMenuOpenId(null);
                        onMarkUnread(conv.id, conv.unreadCount > 0);
                      }}
                      onBlock={() => {
                        setMenuOpenId(null);
                        onBlock(conv.id);
                      }}
                      onArchive={() => {
                        setMenuOpenId(null);
                        onArchive(conv.id);
                      }}
                      onDelete={() => {
                        setMenuOpenId(null);
                        handleDeleteClick(conv);
                      }}
                      onReport={() => {
                        setMenuOpenId(null);
                        onReport(conv.id);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}

        {isSearching && (searchingHidden || hiddenResults.length > 0) && (
          <div className="border-t border-surface-100 mt-1 pt-1">
            <div className="flex items-center gap-1.5 px-4 py-2">
              <History size={11} className="text-text-muted" />
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Đoạn chat đã xóa
              </p>
              {searchingHidden && (
                <Loader2
                  size={11}
                  className="animate-spin text-text-muted ml-auto"
                />
              )}
            </div>
            {!searchingHidden && hiddenResults.length === 0 ? (
              <p className="text-[11px] text-text-muted px-4 pb-3">
                Không tìm thấy đoạn chat đã xóa nào khớp
              </p>
            ) : (
              hiddenResults.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectHidden?.(conv)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-50 transition-colors opacity-70 hover:opacity-100"
                >
                  <Avatar
                    src={conv.avatarUrl ?? undefined}
                    initials={getInitials(conv.name)}
                    size="md"
                    shape="circle"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {conv.name}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {conv.lastMessage || "Đã xóa khỏi danh sách của bạn"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
