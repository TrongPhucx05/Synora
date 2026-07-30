"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import type { Comment, Reply, CommentPayload, CommentSort } from "./types";
import { formatCommentTime } from "./utils";
import { handleLockedResponse } from "@/lib/feed/lockRedirect";

export function useComments(
  postId: number | string,
  sort: CommentSort = "default",
) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const mapComment = useCallback((c: any): Comment => {
    const parseMention = (content: string) => {
      const m = content.match(/^@\[(.+?)\] ([\s\S]+)$/);
      return m ? { replyTo: m[1], text: m[2] } : { text: content };
    };
    return {
      id: c.id,
      authorId: c.authorId,
      author: {
        name: c.author.profile?.displayName ?? c.author.username ?? "User",
        initials: (c.author.profile?.displayName ?? c.author.username ?? "U")
          .split(" ")
          .map((w: string) => w[0])
          .slice(-2)
          .join("")
          .toUpperCase(),
        color: "bg-primary",
        avatarUrl: c.author.profile?.avatarUrl ?? null,
        username: c.author.username ?? null,
      },
      time: formatCommentTime(new Date(c.createdAt)),
      content: c.content,
      imageUrl: c.imageUrl ?? undefined,
      videoUrl: c.videoUrl ?? undefined,
      fileUrl: c.fileUrl ?? undefined,
      fileName: c.fileName ?? undefined,
      fileSize: c.fileSize ?? undefined,
      fileType: c.fileType ?? undefined,
      likes: c._count?.likes ?? 0,
      liked: Array.isArray(c.likes) && c.likes.length > 0,
      replies: (c.replies ?? []).map((r: any) => {
        const { replyTo, text } = parseMention(r.content);
        return {
          id: r.id,
          authorId: r.authorId,
          author: {
            name: r.author.profile?.displayName ?? r.author.username ?? "User",
            initials: (
              r.author.profile?.displayName ??
              r.author.username ??
              "U"
            )
              .split(" ")
              .map((w: string) => w[0])
              .slice(-2)
              .join("")
              .toUpperCase(),
            color: "bg-primary",
            avatarUrl: r.author.profile?.avatarUrl ?? null,
            username: r.author.username ?? null,
          },
          time: formatCommentTime(new Date(r.createdAt)),
          content: text,
          replyTo,
          likes: r._count?.likes ?? 0,
          liked: Array.isArray(r.likes) && r.likes.length > 0,
          hidden: r.hidden ?? false,
        };
      }),
      editedAt: c.editedAt ?? null,
      hidden: c.hidden ?? false,
      hiddenByAuthor: c.hiddenByAuthor ?? null,
      showReplyInput: false,
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data.map(mapComment));
      })
      .finally(() => setLoading(false));
  }, [postId, mapComment]);

  const handleCommentLike = useCallback(
    async (id: string) => {
      let prevLiked = false;
      let prevLikes = 0;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            prevLiked = c.liked;
            prevLikes = c.likes;
            return {
              ...c,
              liked: !c.liked,
              likes: c.liked ? c.likes - 1 : c.likes + 1,
            };
          }
          return c;
        }),
      );
      const res = await fetch(`/api/posts/${postId}/comments/${id}/like`, {
        method: "POST",
      });
      if (!res.ok) {
        if (await handleLockedResponse(res)) return;
        setComments((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, liked: prevLiked, likes: prevLikes } : c,
          ),
        );
      }
    },
    [postId],
  );

  const handleReplyLike = useCallback(
    async (commentId: string, replyId: string) => {
      let prevLiked = false;
      let prevLikes = 0;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: c.replies.map((r) => {
                if (r.id === replyId) {
                  prevLiked = r.liked;
                  prevLikes = r.likes;
                  return {
                    ...r,
                    liked: !r.liked,
                    likes: r.liked ? r.likes - 1 : r.likes + 1,
                  };
                }
                return r;
              }),
            };
          }
          return c;
        }),
      );
      const res = await fetch(`/api/posts/${postId}/comments/${replyId}/like`, {
        method: "POST",
      });
      if (!res.ok) {
        if (await handleLockedResponse(res)) return;
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  replies: c.replies.map((r) =>
                    r.id === replyId
                      ? { ...r, liked: prevLiked, likes: prevLikes }
                      : r,
                  ),
                }
              : c,
          ),
        );
      }
    },
    [postId],
  );

  const toggleReplyInput = useCallback((id: string, name: string) => {
    setReplyingTo((prev) =>
      prev?.id === id && prev?.name === name ? null : { id, name },
    );
  }, []);

  const submitReply = useCallback(
    async (commentId: string, text: string, replyToName: string) => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, parentId: commentId }),
      });
      if (!res.ok) {
        await handleLockedResponse(res);
        return;
      }
      const saved = await res.json();
      const currentName = session?.user?.name ?? "User";
      const isSelf = currentName === replyToName;
      const mentionPrefix = `@${replyToName} `;
      const displayContent = text.startsWith(mentionPrefix)
        ? text.slice(mentionPrefix.length)
        : text;
      const reply: Reply = {
        id: saved.id,
        authorId: session?.user?.id ?? "",
        author: {
          name: currentName,
          initials: currentName
            .split(" ")
            .map((w: string) => w[0])
            .slice(-2)
            .join("")
            .toUpperCase(),
          color: "bg-primary",
          avatarUrl: session?.user?.image ?? null,
        },
        time: "Vừa xong",
        content: displayContent,
        replyTo: isSelf ? undefined : replyToName,
        likes: 0,
        liked: false,
      };
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c,
        ),
      );
      setReplyingTo(null);
    },
    [postId, session],
  );

  const submitComment = useCallback(
    async (payload: CommentPayload) => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: payload.content,
          imageUrl: payload.imageUrl ?? null,
          videoUrl: payload.videoUrl ?? null,
          fileUrl: payload.fileUrl ?? null,
          fileName: payload.fileName ?? null,
          fileSize: payload.fileSize ?? null,
          fileType: payload.fileType ?? null,
        }),
      });
      if (!res.ok) {
        await handleLockedResponse(res);
        return;
      }
      const saved = await res.json();
      const currentName = session?.user?.name ?? "User";
      setComments((prev) => [
        ...prev,
        {
          id: saved.id,
          authorId: session?.user?.id ?? "",
          author: {
            name:
              saved.author.profile?.displayName ??
              saved.author.username ??
              currentName,
            initials: currentName
              .split(" ")
              .map((w: string) => w[0])
              .slice(-2)
              .join("")
              .toUpperCase(),
            color: "bg-primary",
            avatarUrl: session?.user?.image ?? null,
          },
          time: "Vừa xong",
          content: payload.content,
          imageUrl: payload.imageUrl,
          videoUrl: payload.videoUrl,
          fileUrl: payload.fileUrl,
          fileName: payload.fileName,
          fileSize: payload.fileSize,
          fileType: payload.fileType,
          likes: 0,
          liked: false,
          replies: [],
          showReplyInput: false,
        },
      ]);
    },
    [postId, session],
  );

  const deleteComment = useCallback(
    async (id: string) => {
      setComments((prev) => prev.filter((c) => c.id !== id));
      const res = await fetch(`/api/posts/${postId}/comments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        return (data.replyCount ?? 0) + 1;
      }
      return 1;
    },
    [postId],
  );

  const hideComment = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/posts/${postId}/comments/${id}/hide`, {
        method: "POST",
      });
      if (!res.ok) return;
      const data = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                hidden: data.hidden,
                replies: c.replies.map((r) => ({ ...r, hidden: data.hidden })),
              }
            : c,
        ),
      );
    },
    [postId],
  );

  const editComment = useCallback(
    async (id: string, content: string) => {
      const now = new Date().toISOString();
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, content, editedAt: now } : c)),
      );
      await fetch(`/api/posts/${postId}/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    },
    [postId],
  );

  const deleteReply = useCallback(
    async (commentId: string, replyId: string) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
            : c,
        ),
      );
      await fetch(`/api/posts/${postId}/comments/${replyId}`, {
        method: "DELETE",
      });
    },
    [postId],
  );

  const removeCommentsByAuthor = useCallback((authorId: string) => {
    setComments((prev) =>
      prev
        .filter((c) => c.authorId !== authorId)
        .map((c) => ({
          ...c,
          replies: c.replies.filter((r) => r.authorId !== authorId),
        })),
    );
  }, []);

  const sortedComments = useMemo(() => {
    if (sort === "newest") return [...comments].reverse();
    return comments;
  }, [comments, sort]);

  const getVisibleCount = useCallback(
    () =>
      comments
        .filter((c) => !c.hidden)
        .reduce(
          (acc, c) => acc + 1 + c.replies.filter((r) => !r.hidden).length,
          0,
        ),
    [comments],
  );

  return {
    comments,
    sortedComments,
    loading,
    getVisibleCount,
    replyingToId: replyingTo?.id ?? null,
    replyingToName: replyingTo?.name ?? null,
    handleCommentLike,
    handleReplyLike,
    toggleReplyInput,
    submitReply,
    submitComment,
    deleteComment,
    deleteReply,
    editComment,
    hideComment,
    removeCommentsByAuthor,
    cancelReply: () => setReplyingTo(null),
  };
}
