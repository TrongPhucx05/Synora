"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import PostComposer from "@/components/feed/PostComposer";
import type { AttachedFile } from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";
import TrendingTopics from "@/components/ui/TrendingTopics";
import SuggestedPeople from "@/components/ui/SuggestedPeople";

export default function FeedPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetPostId = searchParams.get("post");
  const [posts, setPosts] = useState<any[]>([]);
  const targetCommentId = searchParams.get("comment");
  const [localPosts, setLocalPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = {
    name: session?.user?.name ?? "Người dùng",
    username: session?.user?.username ?? "",
    initials: (session?.user?.name ?? "U")
      .split(" ")
      .map((w: string) => w[0])
      .slice(-2)
      .join("")
      .toUpperCase(),
    image: session?.user?.image ?? null,
  };

  useEffect(() => {
    if (session === undefined) return;
    fetch("/api/posts")
      .then((r) => r.json())
      .then(async (data) => {
        let list = Array.isArray(data) ? data : [];
        if (targetPostId && !list.some((p: any) => p.id === targetPostId)) {
          try {
            const res = await fetch(`/api/posts/${targetPostId}`);
            if (res.ok) {
              const single = await res.json();
              list = [single, ...list];
            }
          } catch {}
        }
        setPosts(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, targetPostId]);

  useEffect(() => {
    if ((targetPostId || targetCommentId) && !loading) {
      const t = setTimeout(() => {
        router.replace("/feed", { scroll: false });
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [targetPostId, targetCommentId, loading, router]);

  const handleDeleted = useCallback((id: string | number) => {
    setLocalPosts((prev) => prev.filter((p) => p.id !== id));
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handlePost = async ({
    content,
    tags,
    uploadedMedia,
    uploadedDocs,
    visibility,
  }: {
    content: string;
    tags: string[];
    files: AttachedFile[];
    uploadedMedia: { url: string; key: string; name: string; type: string }[];
    uploadedDocs: { url: string; key: string; name: string; type: string }[];
    visibility: string;
  }) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        tags,
        uploadedMedia,
        uploadedDocs,
        visibility,
      }),
    });

    if (!res.ok) return;
    const saved = await res.json();
    window.dispatchEvent(new Event("tags:changed"));

    const VIDEO_EXTS = ["MP4", "MOV", "AVI", "WEBM", "MKV"];
    const newPost = {
      id: saved.id,
      authorId: session?.user?.id ?? "",
      author: {
        name: currentUser.name,
        initials: currentUser.initials,
        color: "bg-primary",
        role: "",
        username: currentUser.username,
        avatarUrl: currentUser.image,
      },
      time: "Vừa xong",
      content,
      tags,
      visibility: visibility.toUpperCase() as
        | "PUBLIC"
        | "FRIENDS_ONLY"
        | "PRIVATE",
      images:
        uploadedMedia.length > 0 ? uploadedMedia.map((f) => f.url) : undefined,
      mediaTypes:
        uploadedMedia.length > 0
          ? uploadedMedia.map((f) =>
              VIDEO_EXTS.includes(f.type.toUpperCase()) ? "video" : "image",
            )
          : undefined,
      attachment:
        uploadedDocs.length > 0
          ? {
              name: uploadedDocs[0].name,
              size: "",
              type: uploadedDocs[0].type,
              url: uploadedDocs[0].url,
            }
          : undefined,
      attachments:
        uploadedDocs.length > 0
          ? uploadedDocs.map((d) => ({
              name: d.name,
              size: "",
              type: d.type,
              url: d.url,
            }))
          : undefined,
      likes: 0,
      isLikedByMe: false,
      comments: 0,
    };
    setLocalPosts((prev) =>
      prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev],
    );
  };

  const mappedPosts = posts.map((p) => {
    const imageDocs = p.documents.filter((d: any) =>
      ["IMAGE"].includes(d.type),
    );
    const videoDocs = p.documents.filter((d: any) =>
      ["VIDEO"].includes(d.type),
    );
    const fileDocs = p.documents.filter(
      (d: any) => !["IMAGE", "VIDEO"].includes(d.type),
    );

    const mediaDocs = [...imageDocs, ...videoDocs];

    return {
      id: p.id,
      authorId: p.authorId,
      author: {
        name: p.author.profile?.displayName ?? p.author.username ?? "User",
        initials: (p.author.profile?.displayName ?? p.author.username ?? "U")
          .split(" ")
          .map((w: string) => w[0])
          .slice(-2)
          .join("")
          .toUpperCase(),
        color: "bg-primary",
        role: p.author.profile?.major ?? "",
        username: p.author.username ?? "",
        avatarUrl: p.author.profile?.avatarUrl ?? null,
      },
      time: new Date(p.createdAt).toLocaleDateString("vi-VN"),
      content: p.content,
      tags: p.tags.map((t: any) => `#${t.tag.name}`),
      likes: p._count.likes,
      isLikedByMe: Array.isArray(p.likes) && p.likes.length > 0,
      comments: p._count.comments,
      images:
        mediaDocs.length > 0 ? mediaDocs.map((d: any) => d.fileUrl) : undefined,
      mediaTypes:
        mediaDocs.length > 0
          ? mediaDocs.map((d: any) => (d.type === "VIDEO" ? "video" : "image"))
          : undefined,
      mediaDocIds:
        mediaDocs.length > 0 ? mediaDocs.map((d: any) => d.id) : undefined,
      attachment:
        fileDocs.length > 0
          ? {
              name: fileDocs[0].title,
              size: fileDocs[0].fileSize
                ? `${(fileDocs[0].fileSize / 1024).toFixed(1)} KB`
                : "",
              type:
                fileDocs[0].title.split(".").pop()?.toUpperCase() ??
                fileDocs[0].type,
              url: fileDocs[0].fileUrl,
              docId: fileDocs[0].id,
            }
          : undefined,
      attachments:
        fileDocs.length > 0
          ? fileDocs.map((d: any) => ({
              name: d.title,
              size: d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : "",
              type: d.title.split(".").pop()?.toUpperCase() ?? d.type,
              url: d.fileUrl,
              docId: d.id,
            }))
          : undefined,
      visibility: p.visibility as
        | "PUBLIC"
        | "FRIENDS_ONLY"
        | "PRIVATE"
        | undefined,
    };
  });

  return (
    <div className="flex w-full py-5 items-start">
      <div className="flex-1 flex flex-col gap-4 mx-auto max-w-[820px]">
        {session && session.user?.role !== "ADMIN" && (
          <PostComposer onPost={handlePost} currentUser={currentUser} />
        )}
        {loading ? (
          <div className="text-center text-sm text-text-muted py-10">
            Đang tải...
          </div>
        ) : [...localPosts, ...mappedPosts].length === 0 ? (
          <div className="text-center text-sm text-text-muted py-10">
            Chưa có bài viết nào
          </div>
        ) : (
          (() => {
            const mappedIds = new Set(mappedPosts.map((p) => p.id));
            const deduped = [
              ...localPosts.filter((p) => !mappedIds.has(p.id)),
              ...mappedPosts,
            ];
            return deduped.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDeleted={handleDeleted}
                autoOpenComments={String(post.id) === targetPostId}
                targetCommentId={
                  String(post.id) === targetPostId ? targetCommentId : null
                }
              />
            ));
          })()
        )}
      </div>
      <div className="w-[320px] shrink-0 flex flex-col gap-4">
        <TrendingTopics />
        {!isAdmin && <SuggestedPeople />}
      </div>
    </div>
  );
}
