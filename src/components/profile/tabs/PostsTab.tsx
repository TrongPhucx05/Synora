"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import PostComposer from "@/components/feed/PostComposer";
import type { AttachedFile } from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";
import { mapApiPostToCard } from "@/lib/profile/utils";

interface PostsTabProps {
  username: string;
  isOwner: boolean;
  session: any;
}

export function PostsTab({ username, isOwner, session }: PostsTabProps) {
  const t = useTranslations("profile.postsTab");
  const locale = useLocale();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/profile/${username}/posts`)
      .then((r) => r.json())
      .then((data) => {
        setPosts((data.posts ?? []).map((p: any) => mapApiPostToCard(p, locale, t("defaultUser"))));
        setNextCursor(data.nextCursor);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username, locale, t]);

  const handleDeleted = useCallback((id: string | number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handlePost = async ({
    content, tags, uploadedMedia, uploadedDocs,
  }: {
    content: string;
    tags: string[];
    files: AttachedFile[];
    uploadedMedia: { url: string; key: string; name: string; type: string; size: number }[];
    uploadedDocs: { url: string; key: string; name: string; type: string; size: number }[];
  }) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, tags, uploadedMedia, uploadedDocs }),
    });
    if (res.ok) {
      const newPost = await res.json();
      setPosts((prev) => [mapApiPostToCard(newPost, locale, t("defaultUser")), ...prev]);
    }
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    const res = await fetch(`/api/profile/${username}/posts?cursor=${nextCursor}`);
    const data = await res.json();
    setPosts((prev) => [...prev, ...(data.posts ?? []).map((p: any) => mapApiPostToCard(p, locale, t("defaultUser")))]);
    setNextCursor(data.nextCursor);
  };

  return (
    <>
      {isOwner && session?.user && (
        <PostComposer
          onPost={handlePost}
          currentUser={{
            name: session.user.name ?? t("defaultUser"),
            initials: (session.user.name ?? "U")
              .split(" ")
              .map((w: string) => w[0])
              .slice(-2)
              .join("")
              .toUpperCase(),
            image: session.user.image ?? undefined,
          }}
        />
      )}
      <div className="flex flex-col gap-3 mt-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface border border-surface-200 rounded-2xl animate-pulse" />
          ))
        ) : posts.length === 0 ? (
          <div className="bg-surface border border-surface-200 rounded-2xl p-8 text-center">
            <p className="text-text-muted text-sm">{t("empty")}</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
          ))
        )}
        {nextCursor && (
          <button onClick={loadMore} className="text-xs text-primary font-medium py-2 hover:opacity-70 transition-opacity">
            {t("loadMore")}
          </button>
        )}
      </div>
    </>
  );
}