"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, Lock, Unlock } from "lucide-react";
import { useOutsideClickRefs } from "@/lib/chat/hooks";
import type { AdminUserRow } from "./UsersTable";

export function UserActionsMenu({
  user,
  anchorEl,
  onClose,
  onLock,
  onUnlock,
}: {
  user: AdminUserRow;
  anchorEl: HTMLElement;
  onClose: () => void;
  onLock: () => void;
  onUnlock: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useOutsideClickRefs([ref], onClose);

  useLayoutEffect(() => {
    const rect = anchorEl.getBoundingClientRect();
    const menuWidth = 208;
    const left = Math.min(
      rect.right - menuWidth,
      window.innerWidth - menuWidth - 8,
    );
    setPos({ top: rect.bottom + 6, left: Math.max(8, left) });
  }, [anchorEl]);

  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [onClose]);

  if (!pos) return null;

  const isLocked = user.status !== "ACTIVE";

  return (
    <div
      ref={ref}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-50 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 overflow-hidden"
    >
      <Link
        href={`/profile/${user.username}`}
        target="_blank"
        onClick={onClose}
        className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <User size={13} className="text-slate-400 shrink-0" />
        Xem trang cá nhân
      </Link>

      <div className="h-px bg-slate-100 my-0.5" />

      {isLocked ? (
        <button
          onClick={onUnlock}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          <Unlock size={13} className="shrink-0" />
          Mở khóa tài khoản
        </button>
      ) : (
        <button
          onClick={onLock}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
        >
          <Lock size={13} className="shrink-0" />
          Khóa tài khoản
        </button>
      )}
    </div>
  );
}
