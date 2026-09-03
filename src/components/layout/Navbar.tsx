"use client";

import { User, Settings, LogOut, Shield } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, MessageCircle, X, Clock, Loader2 } from "lucide-react";
import { NotifRow } from "@/components/notifications/NotifRow";
import type { NotifItem } from "@/lib/notifications/types";
import { emitUnreadCount } from "@/lib/notifications/hooks";
import { useUnreadChatCount } from "@/lib/chat/hooks";
import Avatar from "@/components/ui/Avatar";

const HISTORY_KEY = (userId: string) => `synora_search_history_${userId}`;
const MAX_HISTORY = 10;

function loadHistory(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY(userId)) ?? "[]");
  } catch {
    return [];
  }
}

function saveToHistory(query: string, userId: string) {
  if (!query.trim()) return;
  const prev = loadHistory(userId).filter(
    (h) => h.toLowerCase() !== query.toLowerCase(),
  );
  const next = [query, ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY(userId), JSON.stringify(next));
}

function removeFromHistory(query: string, userId: string) {
  const next = loadHistory(userId).filter(
    (h) => h.toLowerCase() !== query.toLowerCase(),
  );
  localStorage.setItem(HISTORY_KEY(userId), JSON.stringify(next));
}

function clearHistory(userId: string) {
  localStorage.setItem(HISTORY_KEY(userId), JSON.stringify([]));
}

const CATEGORY_TABS: { label: string; tab: string; isTopic?: boolean }[] = [
  { label: "Tài liệu", tab: "documents" },
  { label: "Bài viết", tab: "posts" },
  { label: "Mọi người", tab: "people" },
  { label: "Nhóm", tab: "groups" },
  { label: "Chủ đề", tab: "topics", isTopic: true },
];

function SearchDropdown({
  query,
  history,
  onRemoveHistory,
  onClearHistory,
  onSelect,
  onSelectHistory,
}: {
  query: string;
  history: string[];
  onRemoveHistory: (q: string) => void;
  onClearHistory: () => void;
  onSelect: () => void;
  onSelectHistory: (q: string) => void;
}) {
  const hasQuery = query.trim().length > 0;
  const cleanQuery = query.startsWith("#") ? query.slice(1) : query;

  if (!hasQuery) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-2xl shadow-xl border border-surface-200 overflow-hidden z-50">
        {history.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-text-muted">
            Chưa có lịch sử tìm kiếm
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={10} /> Tìm kiếm gần đây
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onClearHistory();
                }}
                className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="px-2 pb-2">
              {history.map((h) => (
                <div
                  key={h}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-50 group/item transition-colors"
                >
                  <Clock size={13} className="text-text-muted shrink-0" />
                  <button
                    className="flex-1 text-left text-sm text-text-secondary truncate"
                    onClick={() => {
                      onSelectHistory(h);
                      onSelect();
                    }}
                  >
                    {h}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveHistory(h);
                    }}
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded hover:bg-surface-200 text-text-muted shrink-0"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-2xl shadow-xl border border-surface-200 overflow-hidden z-50">
      <Link
        href={`/search?q=${encodeURIComponent(query)}`}
        onClick={onSelect}
        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors border-b border-surface-100"
      >
        <Search size={14} className="text-text-muted shrink-0" />
        <span className="flex-1 text-sm text-text-primary font-medium truncate">
          {query}
        </span>
        <span className="text-[10px] text-text-muted shrink-0">Tìm kiếm</span>
      </Link>
      <div className="px-2 py-1.5">
        <p className="text-[10px] font-semibold text-text-muted px-2 mb-1 uppercase tracking-wider">
          Tìm theo danh mục
        </p>
        {CATEGORY_TABS.map(({ label, tab, isTopic }) => {
          const searchQ = isTopic ? `#${cleanQuery}` : query;
          const displaySuffix = isTopic ? `#${cleanQuery}` : `"${query}"`;
          return (
            <Link
              key={tab}
              href={`/search?q=${encodeURIComponent(searchQ)}&tab=${tab}`}
              onClick={onSelect}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface-50 group/cat transition-colors"
            >
              <span className="text-sm text-text-secondary">
                {label}{" "}
                <span className="text-text-muted font-normal">
                  {displaySuffix}
                </span>
              </span>
              <span className="text-[10px] text-text-muted opacity-0 group-hover/cat:opacity-100 transition-opacity shrink-0">
                ↵
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Navbar({
  isLoggedIn = false,
  session,
  status,
}: {
  isLoggedIn?: boolean;
  session?: Session | null;
  status?: string;
}) {
  const router = useRouter();
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [bellLoading, setBellLoading] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const displayName = session?.user?.name ?? "User";
  const email = session?.user?.email ?? "";
  const avatarUrl = session?.user?.image;
  const userId = session?.user?.id ?? "guest";
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const { count: chatUnread } = useUnreadChatCount(isLoggedIn && !isAdmin);
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const fetchNotifs = useCallback(() => {
    if (!isLoggedIn) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifs(data.items ?? []);
        setTotalUnread(data.totalUnread ?? 0);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const handleBellOpen = () => {
    if (!bellOpen) {
      setBellLoading(true);
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => {
          setNotifs(data.items ?? []);
          setTotalUnread(data.totalUnread ?? 0);
        })
        .finally(() => setBellLoading(false));
    }
    setBellOpen((v) => !v);
  };

  useEffect(() => {
    emitUnreadCount(totalUnread);
  }, [totalUnread]);

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

  const refreshHistory = useCallback(() => {
    if (isLoggedIn) setHistory(loadHistory(userId));
  }, [userId, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) setHistory(loadHistory(userId));
    else setHistory([]);
  }, [userId, isLoggedIn]);

  useEffect(() => {
    if (searchFocused) refreshHistory();
  }, [searchFocused, refreshHistory]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node))
        setBellOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchFocused(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node))
        setAvatarOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      setTotalUnread((e as CustomEvent<{ count: number }>).detail.count);
    };
    window.addEventListener("notif:unread-changed", handler);
    return () => window.removeEventListener("notif:unread-changed", handler);
  }, []);

  const doSearch = useCallback(
    (q: string) => {
      if (!q.trim()) return;
      if (isLoggedIn) saveToHistory(q.trim(), userId);
      setSearchFocused(false);
      setSearchQuery("");
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    },
    [router, userId, isLoggedIn],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") doSearch(searchQuery);
      if (e.key === "Escape") setSearchFocused(false);
    },
    [searchQuery, doSearch],
  );

  const handleRemoveHistory = (q: string) => {
    removeFromHistory(q, userId);
    setHistory(loadHistory(userId));
  };

  const handleClearHistory = () => {
    clearHistory(userId);
    setHistory([]);
  };

  const handleDropdownSelect = () => {
    if (searchQuery.trim() && isLoggedIn)
      saveToHistory(searchQuery.trim(), userId);
    setSearchFocused(false);
    setSearchQuery("");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface border-b border-surface-200 flex items-center z-30">
      <div className="w-[330px] shrink-0 px-4">
        <Link
          href="/feed"
          className="inline-flex flex-none w-fit items-center gap-2"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2L14 5.5V12.5L9 16L4 12.5V5.5L9 2Z"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="9" cy="9" r="2" fill="white" />
            </svg>
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">
            Synora
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center px-18">
        <div ref={searchRef} className="w-full max-w-[520px] relative">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm kiếm tài liệu, bài viết, nhóm học tập..."
              className={`w-full pl-9 pr-8 py-2 bg-surface-100 border rounded-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${
                searchFocused
                  ? "border-blue-400 bg-surface shadow-sm shadow-blue-100"
                  : "border-surface-200 hover:border-surface-200"
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {searchFocused && (
            <SearchDropdown
              query={searchQuery}
              history={history}
              onRemoveHistory={handleRemoveHistory}
              onClearHistory={handleClearHistory}
              onSelect={handleDropdownSelect}
              onSelectHistory={doSearch}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-5 px-4 shrink-0">
        {isLoggedIn && !isAdmin && (
          <Link
            href="/chat"
            className="relative p-2.5 rounded-full hover:bg-surface-100 text-text-secondary hover:text-blue-500 transition-colors block"
            title="Tin nhắn"
          >
            <MessageCircle size={18} />
            {chatUnread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-primary rounded-full border border-white flex items-center justify-center px-1 shadow-sm">
                <span className="text-[9px] font-bold text-white leading-none">
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              </span>
            )}
          </Link>
        )}

        {isLoggedIn && !isAdmin && (
          <div ref={bellRef} className="relative">
            <button
              onClick={handleBellOpen}
              className={`relative p-2.5 rounded-full cursor-pointer transition-colors ${
                bellOpen
                  ? "bg-blue-50 dark:bg-blue-500/15 text-blue-500 dark:text-blue-400"
                  : "hover:bg-surface-100 text-text-secondary hover:text-blue-500"
              }`}
              title="Thông báo"
            >
              <Bell size={18} />
              {totalUnread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-primary rounded-full border border-white flex items-center justify-center px-1 shadow-sm">
                  <span className="text-[9px] font-bold text-white leading-none">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute top-full right-0 mt-2 w-[380px] bg-surface rounded-2xl shadow-xl border border-surface-200 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">
                      Thông báo
                    </span>
                    {totalUnread > 0 && (
                      <span className="text-[10px] font-bold text-white bg-primary rounded-full px-1.5 py-0.5 leading-none">
                        {totalUnread}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/notifications"
                      onClick={() => setBellOpen(false)}
                      className="text-[11px] font-semibold text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      Xem tất cả
                    </Link>
                    <button
                      onClick={() => setBellOpen(false)}
                      className="p-1 rounded-lg hover:bg-surface-100 transition-colors"
                    >
                      <X size={14} className="text-text-muted" />
                    </button>
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto py-1">
                  {bellLoading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-text-muted">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-xs">Đang tải...</span>
                    </div>
                  ) : notifs.length === 0 ? (
                    <p className="text-center text-xs text-text-muted py-10">
                      Không có thông báo nào trong 30 ngày qua
                    </p>
                  ) : (
                    notifs
                      .slice(0, 6)
                      .map((notif) => (
                        <NotifRow
                          key={notif.id}
                          notif={notif}
                          compact
                          onRead={markRead}
                        />
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {status === "loading" ? (
          <div className="w-8 h-8 rounded-full bg-surface-200 animate-pulse" />
        ) : isLoggedIn ? (
          <div ref={avatarRef} className="relative">
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar
                src={avatarUrl}
                name={displayName}
                initials={initials}
                size="sm"
              />
            </button>

            {avatarOpen && (
              <div className="absolute top-full right-0 mt-2 w-[220px] bg-surface rounded-2xl shadow-xl border border-surface-200 overflow-hidden z-50">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100">
                  <Avatar
                    src={avatarUrl}
                    name={displayName}
                    initials={initials}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {email}
                    </p>
                  </div>
                </div>
                <div className="p-1.5">
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
                        <Shield
                          size={13}
                          className="text-blue-500 dark:text-blue-400"
                        />
                      </div>
                      <span className="text-sm text-text-secondary">
                        Trang quản trị
                      </span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/profile/${session?.user?.username}`}
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
                          <User
                            size={13}
                            className="text-blue-500 dark:text-blue-400"
                          />
                        </div>
                        <span className="text-sm text-text-secondary">
                          Trang cá nhân
                        </span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <Settings
                            size={13}
                            className="text-emerald-500 dark:text-emerald-400"
                          />
                        </div>
                        <span className="text-sm text-text-secondary">
                          Cài đặt
                        </span>
                      </Link>
                    </>
                  )}
                  <div className="my-1 border-t border-surface-100" />
                  <button
                    onClick={() => {
                      setAvatarOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                      <LogOut
                        size={13}
                        className="text-red-500 dark:text-red-400"
                      />
                    </div>
                    <span className="text-sm text-red-500 dark:text-red-400 font-medium">
                      Đăng xuất
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm font-semibold text-text-secondary border border-surface-200 hover:border-surface-200 hover:bg-surface-50 rounded-full transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors shadow-sm shadow-blue-200"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
