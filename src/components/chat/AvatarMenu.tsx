"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { User, Settings, HelpCircle, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useOutsideClick } from "@/lib/chat/hooks";
import Avatar from "@/components/ui/Avatar";
import { getColorForUser, getInitialsFromName } from "@/lib/chat/utils";

export function AvatarMenu() {
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name ?? user?.username ?? "?";
  const avatarUrl = user?.image ?? null;
  const initials = getInitialsFromName(displayName);
  const color = getColorForUser(user?.id ?? "");
  const t = useTranslations("chat.avatarMenu");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));
  const closeMenu = () => setOpen(false);

  return (
    <div
      ref={ref}
      className="relative shrink-0 md:w-full flex flex-col items-center"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "rounded-full transition-all",
          open
            ? "ring-2 ring-primary/40 ring-offset-1"
            : "hover:ring-2 hover:ring-primary/20 hover:ring-offset-1",
        )}
      >
        <Avatar
          src={avatarUrl}
          initials={initials}
          color={color}
          size="sm"
          shape="circle"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 md:left-full md:right-auto md:top-auto md:bottom-0 md:mt-0 md:ml-2 bg-surface rounded-2xl shadow-xl border border-surface-200 overflow-hidden z-50">
          {
            <>
              <div className="px-4 py-3.5 border-b border-surface-100 flex items-center gap-3">
                <Avatar
                  src={avatarUrl}
                  initials={initials}
                  color={color}
                  size="md"
                  shape="circle"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-0.5 font-medium">
                    ● {t("online")}
                  </p>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href={`/profile/${user?.username}`}
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
                >
                  <User size={14} className="text-text-muted shrink-0" />
                  {t("profile")}
                </Link>
                <Link
                  href="/settings"
                  onClick={closeMenu}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
                >
                  <Settings size={14} className="text-text-muted shrink-0" />
                  {t("settings")}
                </Link>

                <Link
                  href="/support"
                  onClick={closeMenu}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
                >
                  <HelpCircle size={14} className="text-text-muted shrink-0" />
                  {t("help")}
                </Link>
              </div>

              <div className="border-t border-surface-100 py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={14} className="shrink-0" />
                  {t("logout")}
                </button>
              </div>
            </>
          }
        </div>
      )}
    </div>
  );
}
