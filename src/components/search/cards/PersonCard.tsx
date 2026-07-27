"use client";

import Link from "next/link";
import {
  UserPlus,
  Clock,
  MessageCircle,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import type { SearchResult } from "@/lib/search/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import AuthGuardModal from "@/components/ui/AuthGuardModal";

function parseFollowerCount(meta?: string): number {
  const match = meta?.match(/(\d+)\s*người theo dõi/);
  return match ? parseInt(match[1], 10) : 0;
}

export function PersonCard({ r }: { r: SearchResult }) {
  const [status, setStatus] = useState(r.friendStatus ?? "none");
  const [incomingRequestId, setIncomingRequestId] = useState<string | null>(
    r.incomingRequestId ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [followerDelta, setFollowerDelta] = useState(0);
  const [showReplyMenu, setShowReplyMenu] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const replyBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const username = r.username ?? r.href.split("/profile/")[1];
  const sessionUsername = r.sessionUsername;
  const baseFollowers = parseFollowerCount(r.meta);
  const displayMeta = r.meta?.replace(
    /\d+\s*người theo dõi/,
    `${baseFollowers + followerDelta} người theo dõi`,
  );
  const [showAuthModal, setShowAuthModal] = useState(false);

  const openReplyMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (replyBtnRef.current) {
      const rect = replyBtnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setShowReplyMenu((p) => !p);
  };

  useEffect(() => {
    if (!showReplyMenu) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !replyBtnRef.current?.contains(e.target as Node)
      ) {
        setShowReplyMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showReplyMenu]);

  const handleFriendAction = async (e: React.MouseEvent) => {
    if (!r.sessionUsername) {
      setShowAuthModal(true);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${username}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      const prev = status;
      const next = data.status ?? "none";
      setStatus(next);
      if (prev === "none" && next === "pending") setFollowerDelta((d) => d + 1);
      else if (prev === "pending" && next === "none")
        setFollowerDelta((d) => d - 1);
      else if (prev === "friends" && next === "none")
        setFollowerDelta((d) => d - 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (
    e: React.MouseEvent,
    action: "accept" | "reject",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!incomingRequestId || !sessionUsername || loading) return;
    setLoading(true);
    setShowReplyMenu(false);
    try {
      const res = await fetch(
        `/api/profile/${sessionUsername}/friend-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: incomingRequestId, action }),
        },
      );
      if (res.ok) {
        if (action === "accept") {
          setStatus("friends");
        } else {
          setStatus("none");
        }
        setFollowerDelta((d) => d - 1);
        setIncomingRequestId(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link
        href={r.href}
        className="group flex items-center gap-3 p-4 rounded-xl hover:bg-surface-50 border border-transparent hover:border-surface-200 transition-all"
      >
        {r.avatarUrl ? (
          <img
            src={r.avatarUrl}
            alt={r.title}
            className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-white shadow-sm"
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${r.avatarColor ?? "bg-primary"}`}
          >
            {r.avatar}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
            {r.title}
          </p>
          {r.subtitle && (
            <p className="text-xs text-text-secondary truncate mt-0.5">
              {r.subtitle}
            </p>
          )}
          <p className="text-[11px] text-text-muted mt-0.5">{displayMeta}</p>
        </div>

        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="shrink-0"
        >
          {status === "friends" ? (
            <div className="flex items-center gap-1.5">
              {r.canMessage !== false && (
                <Link
                  href={`/chat?with=${username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all"
                >
                  <MessageCircle size={12} /> Nhắn tin
                </Link>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowUnfriendConfirm(true);
                }}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-100 text-text-secondary border border-surface-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-70"
              >
                <UserCheck size={12} /> Bạn bè
              </button>
            </div>
          ) : incomingRequestId ? (
            <button
              ref={replyBtnRef}
              onClick={openReplyMenu}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
            >
              Trả lời{" "}
              <ChevronDown
                size={12}
                className={clsx(
                  "transition-transform duration-150",
                  showReplyMenu && "rotate-180",
                )}
              />
            </button>
          ) : status === "pending" ? (
            <button
              onClick={handleFriendAction}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-50 text-text-muted border border-surface-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-70"
            >
              <Clock size={12} /> Đã gửi
            </button>
          ) : r.canSendFriendRequest === false ? null : (
            <button
              onClick={handleFriendAction}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-all disabled:opacity-70"
            >
              <UserPlus size={12} /> Kết bạn
            </button>
          )}
        </div>
      </Link>

      {showReplyMenu &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: menuPos.top,
              right: menuPos.right,
            }}
            className="bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden z-[100] min-w-[150px] py-1"
          >
            <button
              onClick={(e) => handleRequestAction(e, "accept")}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-text-primary hover:bg-surface-50 transition-colors"
            >
              <UserCheck size={13} className="text-primary" /> Chấp nhận
            </button>
            <button
              onClick={(e) => handleRequestAction(e, "reject")}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <span className="text-sm leading-none">✕</span> Từ chối
            </button>
          </div>,
          document.body,
        )}

      {showUnfriendConfirm && (
        <ConfirmDialog
          displayName={r.title}
          onConfirm={() => {
            setShowUnfriendConfirm(false);
            setLoading(true);
            fetch(`/api/profile/${username}/follow`, { method: "POST" })
              .then((res) => res.json())
              .then((data) => {
                const next = data.status ?? "none";
                setStatus(next);
              })
              .finally(() => setLoading(false));
          }}
          onCancel={() => setShowUnfriendConfirm(false)}
        />
      )}
      {showAuthModal && (
        <AuthGuardModal
          onClose={() => setShowAuthModal(false)}
          action="kết bạn với mọi người"
        />
      )}
    </>
  );
}
