"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, MessageSquare, Share2, Inbox } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import CommentModal from "@/components/feed/PostCard/CommentModal";
import { PostRowMenu } from "./PostRowMenu";
import {
  AdminDeletePostDialog,
  type AdminDeletePayload,
} from "./AdminDeletePostDialog";
import type { TopPostItem } from "@/lib/admin/dashboard/types";
import type { Post } from "@/lib/feed/types";

const MAX_SLOTS = 5;

function toFeedPost(item: TopPostItem): Post {
  return {
    id: item.id,
    authorId: item.authorId,
    author: {
      name: item.authorName,
      initials: item.authorName
        .split(" ")
        .map((w) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase(),
      color: "bg-primary",
      role: "",
      username: item.authorUsername,
      avatarUrl: item.avatarUrl,
    },
    time: new Date(item.createdAt).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    content: item.content,
    images: item.images,
    mediaTypes: item.mediaTypes,
    attachment: item.attachment,
    visibility: item.visibility,
    tags: item.tags,
    likes: item.likeCount,
    comments: item.commentCount,
    isLikedByMe: false,
    editedAt: item.editedAt,
  };
}

const RANK_STYLES = [
  "bg-amber-100 text-amber-700",
  "bg-slate-200 text-slate-600",
  "bg-orange-100 text-orange-700",
  "bg-slate-100 text-slate-500",
  "bg-slate-100 text-slate-500",
];

export function TopPosts({
  posts,
  loading,
  onPostDeleted,
}: {
  posts: TopPostItem[];
  loading?: boolean;
  onPostDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [viewingPost, setViewingPost] = useState<TopPostItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TopPostItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (payload: AdminDeletePayload) => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/posts/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error);
      }
      showToast(
        payload.notifyUser
          ? "Đã xóa bài viết và gửi cảnh báo"
          : "Đã xóa bài viết",
        "success",
      );
      onPostDeleted(deleteTarget.id);
      if (viewingPost?.id === deleteTarget.id) setViewingPost(null);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Không thể xóa bài viết",
        "error",
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const renderRowMenu = (post: TopPostItem) => (
    <PostRowMenu
      onViewProfile={() => router.push(`/profile/${post.authorUsername}`)}
      onViewPost={() => setViewingPost(post)}
      onDelete={() => setDeleteTarget(post)}
    />
  );

  const emptySlots = Math.max(0, MAX_SLOTS - posts.length);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-bold text-slate-900">
          Top 5 bài viết nhiều tương tác
        </h3>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-slate-100 flex items-center gap-3 animate-pulse"
            >
              <div className="w-6 h-6 rounded-full bg-slate-100 shrink-0" />
              <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 bg-slate-100 rounded" />
                <div className="h-2.5 w-1/3 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center">
            <Inbox size={18} className="text-slate-300" />
          </div>
          <p className="text-xs text-slate-400">
            Chưa có bài viết công khai nào
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((post, i) => (
            <div
              key={post.id}
              onClick={() => setViewingPost(post)}
              className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-colors cursor-pointer flex items-center gap-3"
            >
              <span className={clsxRank(i)} aria-hidden>
                {i + 1}
              </span>

              <Avatar
                src={post.avatarUrl}
                name={post.authorName}
                initials={post.authorName.slice(0, 2).toUpperCase()}
                size="sm"
              />

              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-semibold text-slate-800 leading-tight overflow-hidden text-ellipsis whitespace-nowrap"
                  title={post.excerpt}
                >
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                    {post.authorName}
                  </span>
                  <span className="w-px h-3 bg-slate-200 shrink-0" />
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium shrink-0">
                    <ThumbsUp size={11} className="text-slate-400" />
                    {post.likeCount}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium shrink-0">
                    <MessageSquare size={11} className="text-slate-400" />
                    {post.commentCount}
                  </span>
                  <span
                    className="flex items-center gap-1 text-[11px] text-slate-300 font-medium shrink-0"
                    title="Chưa hỗ trợ theo dõi lượt chia sẻ"
                  >
                    <Share2 size={11} className="text-slate-400" />
                  </span>
                </div>
              </div>

              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                {renderRowMenu(post)}
              </div>
            </div>
          ))}

          {emptySlots > 0 &&
            Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-3 rounded-xl border border-dashed border-slate-100 flex items-center gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-slate-50 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {posts.length + i + 1}
                </span>
                <span className="text-[11px] text-slate-300">
                  Chưa có bài viết nổi bật ở vị trí này
                </span>
              </div>
            ))}
        </div>
      )}

      {viewingPost && (
        <CommentModal
          post={toFeedPost(viewingPost)}
          liked={false}
          likeCount={viewingPost.likeCount}
          onLike={() => {}}
          onClose={() => setViewingPost(null)}
          isAdmin
          menuSlot={renderRowMenu(viewingPost)}
        />
      )}

      {deleteTarget && (
        <AdminDeletePostDialog
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function clsxRank(i: number) {
  const base =
    "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0";
  return `${base} ${RANK_STYLES[i] ?? "bg-slate-100 text-slate-400"}`;
}
