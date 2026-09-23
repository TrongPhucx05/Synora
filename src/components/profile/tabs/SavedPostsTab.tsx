"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import PostCard from "@/components/feed/PostCard";
import { mapApiPostToCard } from "@/lib/profile/utils";
import { useToast } from "@/components/ui/Toast";

interface SavedPostsTabProps {
  username: string;
  isOwner: boolean;
}

export function SavedPostsTab({ username, isOwner }: SavedPostsTabProps) {
  const t = useTranslations("profile.savedPostsTab");
  const tPosts = useTranslations("profile.postsTab");
  const locale = useLocale();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOwner) {
      setLoading(false);
      return;
    }
    fetch(`/api/profile/${username}/saved`)
      .then((r) => r.json())
      .then((data) => {
        setPosts((data.posts ?? []).map((p: any) => mapApiPostToCard(p, locale, tPosts("defaultUser"))));
        setNextCursor(data.nextCursor);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username, isOwner, locale, tPosts]);

  const handlePostSaveToggle = useCallback(
    (postId: string | number, savedState: boolean) => {
      if (!savedState) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        showToast(t("unsavedToast"), "unsave");
      } else {
        showToast(t("savedToast"), "save");
      }
    },
    [showToast, t],
  );

  const loadMore = async () => {
    if (!nextCursor) return;
    const res = await fetch(
      `/api/profile/${username}/saved?cursor=${nextCursor}`,
    );
    const data = await res.json();
    setPosts((prev) => [...prev, ...(data.posts ?? []).map((p: any) => mapApiPostToCard(p, locale, tPosts("defaultUser")))]);
    setNextCursor(data.nextCursor);
  };

  if (!isOwner) {
    return (
      <div className="bg-surface border border-surface-200 rounded-2xl p-8 text-center">
        <p className="text-text-muted text-sm">
          {t("ownerOnly")}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-surface border border-surface-200 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-surface border border-surface-200 rounded-2xl p-8 text-center">
        <p className="text-text-muted text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isSavedInitially={true}
            onDeleted={(id) =>
              setPosts((prev) => prev.filter((p) => p.id !== id))
            }
            onSaveToggle={handlePostSaveToggle}
          />
        ))}
        {nextCursor && (
          <button
            onClick={loadMore}
            className="text-xs text-primary font-medium py-2 hover:opacity-70 transition-opacity"
          >
            {t("loadMore")}
          </button>
        )}
      </div>
    </>
  );
}