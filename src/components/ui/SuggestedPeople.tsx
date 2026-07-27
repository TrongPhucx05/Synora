"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Loader2,
  UserPlus,
  Clock,
  UserCheck,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";
import { createPortal } from "react-dom";
import { useRef } from "react";
import Avatar from "@/components/ui/Avatar";
import AuthGuardModal from "@/components/ui/AuthGuardModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  followerCount: number;
  friendStatus?: "none" | "pending" | "friends";
  incomingRequestId?: string | null;
  canSendFriendRequest?: boolean;
}

function formatCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

interface Props {
  variant?: "feed" | "search";
}

function UserRow({
  user,
  variant,
  sessionUsername,
  onRemove,
}: {
  user: SuggestedUser;
  variant: "feed" | "search";
  sessionUsername?: string | null;
  onRemove: (id: string) => void;
}) {
  const [status, setStatus] = useState<"none" | "pending" | "friends">(
    user.friendStatus ?? "none",
  );
  const [incomingRequestId, setIncomingRequestId] = useState<string | null>(
    user.incomingRequestId ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [showReplyMenu, setShowReplyMenu] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const replyBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

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

  const handleFriendAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionUsername) {
      setShowAuthModal(true);
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${user.username}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Không thể gửi lời mời kết bạn", "error");
        return;
      }
      const next = data.status ?? "none";
      if (next === "pending") {
        onRemove(user.id);
      } else {
        setStatus(next);
      }
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
        setIncomingRequestId(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <Link href={`/profile/${user.username}`} className="shrink-0">
        <Avatar
          src={user.avatarUrl}
          name={user.displayName}
          initials={getInitials(user.displayName)}
          color="bg-primary"
          size="sm"
        />
      </Link>

      <Link
        href={`/profile/${user.username}`}
        className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
      >
        <p className="text-xs font-semibold text-text-primary leading-tight truncate">
          {user.displayName}
        </p>
        <p className="text-[10px] text-text-muted truncate">
          {user.role && <span>{user.role}</span>}
          {user.followerCount > 0 && (
            <>
              {user.role ? " · " : ""}
              {formatCount(user.followerCount)} người theo dõi
            </>
          )}
        </p>
      </Link>

      <div
        className="shrink-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {status === "friends" ? (
          <div className="flex items-center gap-1">
            <Link
              href={`/chat?with=${user.username}`}
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                "flex items-center gap-1 text-[10px] font-semibold text-primary border border-primary/30 hover:bg-primary hover:text-white transition-all disabled:opacity-70",
                variant === "feed"
                  ? "px-2 py-1 rounded-full"
                  : "px-2 py-1 rounded-md",
              )}
            >
              <MessageCircle size={10} />
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowUnfriendConfirm(true);
              }}
              disabled={loading}
              className={clsx(
                "flex items-center gap-1 text-[10px] font-semibold bg-surface-100 text-text-secondary border border-surface-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-70",
                variant === "feed"
                  ? "px-2 py-1 rounded-full"
                  : "px-2 py-1 rounded-md",
              )}
            >
              <UserCheck size={10} />
            </button>
          </div>
        ) : incomingRequestId ? (
          <button
            ref={replyBtnRef}
            onClick={openReplyMenu}
            disabled={loading}
            className={clsx(
              "flex items-center gap-1 text-[10px] font-semibold bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-70",
              variant === "feed"
                ? "px-2.5 py-1.5 rounded-full"
                : "px-2 py-1 rounded-md",
            )}
          >
            Trả lời{" "}
            <ChevronDown
              size={10}
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
            className={clsx(
              "flex items-center gap-1 text-[10px] font-semibold bg-surface-50 text-text-muted border border-surface-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-70",
              variant === "feed"
                ? "px-2.5 py-1.5 rounded-full"
                : "px-2 py-1 rounded-md",
            )}
          >
            <Clock size={10} /> Đã gửi
          </button>
        ) : user.canSendFriendRequest === false ? null : (
          <button
            onClick={handleFriendAction}
            disabled={loading}
            className={clsx(
              "flex items-center gap-1 text-[10px] font-semibold transition-all disabled:opacity-70",
              variant === "feed"
                ? "bg-primary/10 text-primary hover:bg-primary hover:text-white px-2.5 py-1.5 rounded-full"
                : "text-primary border border-primary/30 hover:bg-primary hover:text-white px-2 py-1 rounded-md",
            )}
          >
            <UserPlus size={10} /> Kết bạn
          </button>
        )}
      </div>

      {showReplyMenu &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: menuPos.top,
              right: menuPos.right,
            }}
            className="bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden z-[100] min-w-[140px] py-1"
          >
            <button
              onClick={(e) => handleRequestAction(e, "accept")}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-text-primary hover:bg-surface-50 transition-colors"
            >
              <UserCheck size={12} className="text-primary" /> Chấp nhận
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
          displayName={user.displayName}
          onConfirm={() => {
            setShowUnfriendConfirm(false);
            setLoading(true);
            fetch(`/api/profile/${user.username}/follow`, { method: "POST" })
              .then((res) => res.json())
              .then((data) => setStatus(data.status ?? "none"))
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
    </div>
  );
}

export default function SuggestedPeople({ variant = "feed" }: Props) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/suggested")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .finally(() => setLoading(false));
  }, [session]);

  const handleRemove = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-xl border border-surface-200 p-4",
        variant === "feed" && "shadow-card",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        {variant === "feed" ? (
          <>
            <h3 className="text-sm font-semibold text-text-primary">
              Gợi ý kết bạn
            </h3>
            <Link
              href="/search?tab=people"
              className="text-[11px] text-primary font-medium hover:underline"
            >
              Xem thêm
            </Link>
          </>
        ) : (
          <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
            Gợi ý kết bạn
          </h3>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin text-text-muted" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-3">
          Không có gợi ý nào
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              variant={variant}
              sessionUsername={session?.user?.username ?? null}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
