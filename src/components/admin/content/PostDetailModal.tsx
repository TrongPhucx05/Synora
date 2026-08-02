"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import PostCard from "@/components/feed/PostCard";
import type { Post } from "@/lib/feed/types";

export function PostDetailModal({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/posts/${postId}/detail`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Không tải được bài viết");
        if (!cancelled) setPost(data);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-transparent w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <div className="flex items-center justify-between px-1 pb-2">
          <h2 className="text-sm font-semibold text-white/90">
            Chi tiết bài viết
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-slate-600 shadow shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="bg-white rounded-xl p-10 text-center text-sm text-slate-400">
            Đang tải bài viết...
          </div>
        )}
        {error && (
          <div className="bg-white rounded-xl p-10 text-center text-sm text-red-500">
            {error}
          </div>
        )}
        {post && (
          <div onClick={(e) => e.stopPropagation()}>
            <PostCard post={post} />
          </div>
        )}
      </div>
    </div>
  );
}
