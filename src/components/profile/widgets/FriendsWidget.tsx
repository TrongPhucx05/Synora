"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { UserCheck } from "lucide-react";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import Avatar from "@/components/ui/Avatar";

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  followerCount: number;
}

export function FriendsWidget({
  username,
  refreshKey,
  onUnfriend,
}: {
  username: string;
  refreshKey?: number;
  onUnfriend?: () => void;
}) {
  const t = useTranslations("profile.friendsWidget");
  const tSearch = useTranslations("search");
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [confirmFriend, setConfirmFriend] = useState<Friend | null>(null);
  const { showToast } = useToast();
  const actionInProgress = useRef<Set<string>>(new Set());
  const isOwner = session?.user?.username === username;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/profile/${username}/friends`)
      .then((r) => r.json())
      .then((data) => {
        setHidden(!!data.hidden);
        const unique = Array.from(
          new Map((data.friends ?? []).map((f: Friend) => [f.id, f])).values(),
        ) as Friend[];
        setFriends(unique);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username, refreshKey]);

  const doUnfriend = async (friend: Friend) => {
    setConfirmFriend(null);
    if (actionInProgress.current.has(friend.id)) return;
    actionInProgress.current.add(friend.id);
    try {
      await fetch(`/api/profile/${friend.username}/follow`, { method: "POST" });
      setFriends((prev) => prev.filter((f) => f.id !== friend.id));
      showToast(t("unfriendedToast"), "delete");
      onUnfriend?.();
    } finally {
      actionInProgress.current.delete(friend.id);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface border border-surface-200 rounded-2xl p-4">
        <div className="h-3.5 w-20 bg-surface-100 rounded animate-pulse mb-3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-surface-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-surface-100 rounded animate-pulse w-3/4" />
              <div className="h-2.5 bg-surface-100 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {confirmFriend && (
        <ConfirmDialog
          displayName={confirmFriend.displayName}
          onConfirm={() => doUnfriend(confirmFriend)}
          onCancel={() => setConfirmFriend(null)}
        />
      )}

      <div className="bg-surface border border-surface-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-text-primary">{t("title")}</h3>
            {friends.length > 0 && (
              <span className="text-[10px] text-text-muted bg-surface-100 px-1.5 py-0.5 rounded-full">
                {friends.length}
              </span>
            )}
          </div>
          {!hidden && (
            <NextLink
              href={`/friends/${username}`}
              className="flex items-center gap-0.5 text-[11px] font-medium text-primary transition-colors"
            >
              {t("seeAll")}
            </NextLink>
          )}
        </div>

        {hidden ? (
          <p className="text-[11px] text-text-muted text-center py-3">
            {t("hidden")}
          </p>
        ) : friends.length === 0 ? (
          <p className="text-[11px] text-text-muted text-center py-3">
            {t("empty")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-2 group">
                <NextLink href={`/profile/${f.username}`} className="shrink-0">
                  <Avatar
                    src={f.avatarUrl}
                    name={f.displayName}
                    initials={f.displayName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(-2)
                      .join("")
                      .toUpperCase()}
                    color="bg-primary"
                    size="sm"
                  />
                </NextLink>
                <div className="flex-1 min-w-0">
                  <NextLink href={`/profile/${f.username}`}>
                    <p className="text-xs font-medium text-text-primary truncate hover:text-primary transition-colors">
                      {f.displayName}
                    </p>
                  </NextLink>
                  <p className="text-[10px] text-text-muted">
                    {f.followerCount.toLocaleString("vi-VN")} {tSearch("followersLabel")}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setConfirmFriend(f)}
                    className="shrink-0 p-1.5 rounded-full transition-colors text-primary bg-primary/10 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-500"
                    title={t("unfriendTooltip")}
                  >
                    <UserCheck size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}