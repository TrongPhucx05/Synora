"use client";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Search, MoreVertical, User, Ban, Flag } from "lucide-react";
import { useOutsideClickRefs } from "@/lib/chat/hooks";
import Avatar from "@/components/ui/Avatar";

export type BlockedUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  blockedAt: string;
};

function useMenuPosition(anchorRef: React.RefObject<HTMLElement | null>) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    let top = anchorRect.bottom + 4;
    let left = anchorRect.right - menuRect.width;

    if (top + menuRect.height > window.innerHeight) {
      top = anchorRect.top - menuRect.height - 4;
    }
    if (left < 4) left = 4;

    setPos({ top, left });
  }, [anchorRef]);

  return { menuRef, pos };
}

export function BlockedItemMenu({
  anchorRef,
  user,
  onClose,
  onUnblock,
  onReport,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  user: BlockedUser;
  onClose: () => void;
  onUnblock: () => void;
  onReport: () => void;
}) {
  const { menuRef, pos } = useMenuPosition(anchorRef);
  useOutsideClickRefs([menuRef, anchorRef], onClose);

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
      }}
      className="z-[110] w-44 bg-white rounded-xl shadow-lg border border-surface-100 py-1 overflow-hidden"
    >
      <Link
        href={`/profile/${user.username}`}
        onClick={onClose}
        className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <User size={13} className="text-text-muted shrink-0" />
        Trang cá nhân
      </Link>
      <button
        onClick={onUnblock}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <Ban size={13} className="text-text-muted shrink-0" />
        Bỏ chặn
      </button>
      <div className="h-px bg-surface-100 my-0.5" />
      <button
        onClick={onReport}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
      >
        <Flag size={13} className="shrink-0" />
        Báo cáo
      </button>
    </div>,
    document.body,
  );
}

export function BlockedUsersModal({
  users,
  onClose,
  onUnblock,
  onReport,
}: {
  users: BlockedUser[];
  onClose: () => void;
  onUnblock: (id: string) => void;
  onReport: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const sorted = [...users].sort(
    (a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime(),
  );
  const filtered = sorted.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Danh sách chặn
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              {users.length} người đã chặn
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors text-text-muted hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-surface-100 shrink-0">
          <div className="flex items-center gap-2 bg-surface-100 rounded-full px-3.5 py-2">
            <Search size={14} className="text-text-muted shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm trong danh sách chặn..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-2 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-text-muted">
              <Ban size={22} className="opacity-40" />
              <p className="text-xs">
                {query ? "Không tìm thấy kết quả" : "Bạn chưa chặn ai"}
              </p>
            </div>
          ) : (
            filtered.map((u) => {
              const menuOpen = menuOpenId === u.id;
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 transition-colors"
                >
                  <Avatar
                    src={u.avatarUrl ?? undefined}
                    initials={u.name.slice(0, 2).toUpperCase()}
                    size="sm"
                    shape="circle"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      @{u.username}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      onClick={() => setMenuOpenId(menuOpen ? null : u.id)}
                      ref={(el) => {
                        buttonRefs.current[u.id] = el;
                      }}
                      className="p-1.5 rounded-full hover:bg-surface-200 text-text-muted transition-colors"
                    >
                      <MoreVertical size={15} />
                    </button>
                    {menuOpen && (
                      <BlockedItemMenu
                        anchorRef={{ current: buttonRefs.current[u.id] }}
                        user={u}
                        onClose={() => setMenuOpenId(null)}
                        onUnblock={() => {
                          setMenuOpenId(null);
                          onUnblock(u.id);
                        }}
                        onReport={() => {
                          setMenuOpenId(null);
                          onReport(u.id);
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
