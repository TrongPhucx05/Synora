"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Menu, ShieldCheck } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
};

export default function Navbar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = session?.user?.name ?? "Admin";
  const avatarUrl = session?.user?.image;
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = ROLE_LABELS[session?.user?.role ?? ""] ?? "Admin";

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  return (
    <header className="h-14 bg-surface border-b border-surface-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          aria-label="Mở menu"
          className="lg:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:bg-surface-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <ThemeToggle />
      </div>
      <div className="flex items-center gap-3">
        <div ref={ref} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar
              src={avatarUrl}
              name={displayName}
              initials={initials}
              size="sm"
            />
          </button>

          {menuOpen && (
            <div className="absolute top-full right-0 mt-2 w-[200px] bg-surface rounded-2xl shadow-xl border border-surface-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-surface-100">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-text-muted truncate">
                  {session?.user?.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
              >
                <LogOut size={14} className="text-red-500 dark:text-red-400" />
                <span className="text-sm text-red-500 dark:text-red-400 font-medium">
                  Đăng xuất
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
