"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { clsx } from "clsx";
import {
  X,
  ThumbsUp,
  MessageCircle,
  Share2,
  Globe,
  Users as UsersIcon,
  Lock as LockIcon,
} from "lucide-react";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import { useComments } from "@/lib/feed/hooks";
import type { Post, CommentSort, CommentPayload } from "@/lib/feed/types";
import RichContent from "./RichContent";
import AttachmentRow from "./AttachmentRow";
import ImageGrid from "./ImageGrid";
import MediaLightbox from "./MediaLightbox";
import CommentList from "@/components/feed/comment/CommentList";
import CommentInput from "@/components/feed/comment/CommentInput";

export default function CommentModal({
  post,
  liked,
  likeCount,
  onLike,
  onClose,
  onCountChange,
  onSyncCount,
  onAuthRequired,
  menuSlot,
  targetCommentId,
  isAdmin = false,
}: {
  post: Post;
  liked: boolean;
  likeCount: number;
  onLike: () => void;
  onClose: () => void;
  onCountChange?: (delta: number) => void;
  onSyncCount?: (count: number) => void;
  onAuthRequired?: (action: string) => void;
  menuSlot?: React.ReactNode;
  targetCommentId?: string | null;
  isAdmin?: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [sort, setSort] = useState<CommentSort>("default");
  const { data: session, status } = useSession();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    comments,
    sortedComments,
    loading: commentsLoading,
    getVisibleCount,
    replyingToId,
    replyingToName,
    handleCommentLike,
    handleReplyLike,
    toggleReplyInput,
    submitReply,
    submitComment,
    cancelReply,
    deleteComment,
    deleteReply,
    editComment,
    hideComment,
    removeCommentsByAuthor,
  } = useComments(post.id, sort);

  useEffect(() => {
    onSyncCount?.(getVisibleCount());
  }, [comments, getVisibleCount, onSyncCount]);

  const handleSubmitComment = useCallback(
    async (payload: CommentPayload) => {
      await submitComment(payload);
    },
    [submitComment],
  );

  const handleSubmitReply = useCallback(
    async (commentId: string, text: string, replyTo: string) => {
      if (isAdmin) return;
      await submitReply(commentId, text, replyTo);
    },
    [submitReply],
  );

  if (lightboxIndex !== null && post.images) {
    return (
      <MediaLightbox
        images={post.images}
        mediaTypes={post.mediaTypes}
        initialIndex={lightboxIndex}
        post={post}
        liked={liked}
        likeCount={likeCount}
        onLike={onLike}
        onClose={() => setLightboxIndex(null)}
        onCountChange={onCountChange}
        menuSlot={menuSlot}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/25 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-start gap-3 px-4 pt-4 pb-3 shrink-0">
          <NextLink
            href={
              post.author.username ? `/profile/${post.author.username}` : "#"
            }
            className="shrink-0"
          >
            <Avatar
              src={post.author.avatarUrl}
              name={post.author.name}
              initials={post.author.initials}
              color={post.author.color}
              size="md"
            />
          </NextLink>
          <div className="flex-1 min-w-0">
            <NextLink
              href={
                post.author.username ? `/profile/${post.author.username}` : "#"
              }
            >
              <p className="text-sm font-semibold text-text-primary hover:underline">
                {post.author.name}
              </p>
            </NextLink>
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-secondary">{post.time}</span>
              {post.visibility && (
                <>
                  <span className="text-text-muted text-xs">·</span>
                  <span className="text-[10px] text-text-secondary flex items-center gap-0.5">
                    {post.visibility === "PRIVATE" ? (
                      <>
                        <LockIcon size={10} /> Riêng tư
                      </>
                    ) : post.visibility === "FRIENDS_ONLY" ? (
                      <>
                        <UsersIcon size={10} /> Bạn bè
                      </>
                    ) : (
                      <>
                        <Globe size={10} /> Công khai
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
          {menuSlot}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center text-text-secondary hover:bg-surface-200 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-4 pb-3 shrink-0">
          <RichContent
            text={post.content}
            className="text-sm text-text-primary leading-relaxed mb-2"
          />
          {post.images && post.images.length > 0 && (
            <div className="mb-2">
              <ImageGrid
                images={post.images}
                mediaTypes={post.mediaTypes}
                onImageClick={(i) => setLightboxIndex(i)}
                maxImageHeight="280px"
              />
            </div>
          )}
          {post.attachment && <AttachmentRow attachment={post.attachment} />}
        </div>

        <div className="flex items-center gap-1 px-3 py-1 border-y border-surface-100 shrink-0">
          <button
            onClick={onLike}
            disabled={isAdmin}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              liked
                ? "text-primary font-medium"
                : "text-text-secondary hover:bg-surface-100",
              isAdmin && "opacity-40 cursor-not-allowed",
            )}
          >
            <ThumbsUp
              size={15}
              className={clsx(
                "transition-transform duration-150",
                liked ? "scale-110 fill-primary" : "",
              )}
            />
            <span>{likeCount}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-100 transition-colors">
            <MessageCircle size={15} />
            <span>
              {comments
                .filter((c) => !c.hidden)
                .reduce(
                  (acc, c) =>
                    acc + 1 + c.replies.filter((r) => !r.hidden).length,
                  0,
                )}
            </span>
          </button>
          {!isAdmin && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-100 transition-colors ml-auto">
              <Share2 size={15} />
              <span>Chia sẻ</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 px-4 py-2 shrink-0">
          {(["default", "newest", "oldest"] as CommentSort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                sort === s
                  ? "bg-primary text-white"
                  : "bg-surface-100 text-text-secondary hover:bg-surface-200",
              )}
            >
              {s === "default"
                ? "Tất cả"
                : s === "newest"
                  ? "Mới nhất"
                  : "Cũ nhất"}
            </button>
          ))}
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-visible px-4 pr-12 py-3 flex flex-col gap-3 min-h-0"
        >
          <CommentList
            comments={sortedComments}
            replyingToId={replyingToId}
            replyingToName={replyingToName}
            currentUserName={session?.user?.name ?? ""}
            onLike={handleCommentLike}
            onToggleReply={toggleReplyInput}
            onSubmitReply={handleSubmitReply}
            onCancelReply={cancelReply}
            onLikeReply={handleReplyLike}
            postAuthorId={post.authorId}
            currentUserId={
              status === "authenticated" ? (session?.user?.id ?? "") : ""
            }
            onDeleteComment={deleteComment}
            onDeleteReply={deleteReply}
            onEditComment={editComment}
            onHideComment={async (id) => {
              const comment = comments.find((c) => c.id === id);
              await hideComment(id);
              if (comment) {
                const willHide = !comment.hidden;
                const visibleReplies = comment.replies.filter(
                  (r) => !r.hidden,
                ).length;
                onCountChange?.(
                  willHide ? -(1 + visibleReplies) : 1 + visibleReplies,
                );
              }
            }}
            onCountChange={onCountChange}
            onAuthRequired={onAuthRequired}
            scrollContainer={scrollContainerRef}
            targetCommentId={targetCommentId}
            disabled={commentsLoading}
            isAdmin={isAdmin}
            onUserBlocked={removeCommentsByAuthor}
          />
        </div>

        <div className="px-4 pb-4 pt-3 border-t border-surface-100 shrink-0">
          {isAdmin ? (
            <p className="w-full py-2.5 text-center text-xs font-medium text-text-secondary bg-surface-50 rounded-2xl">
              Tài khoản người quản trị không thể bình luận
            </p>
          ) : status === "authenticated" ? (
            <CommentInput
              onSubmit={handleSubmitComment}
              disabled={commentsLoading}
            />
          ) : (
            <button
              onClick={() => onAuthRequired?.("bình luận")}
              className="w-full py-2.5 text-xs font-medium text-text-secondary border border-surface-200 rounded-2xl hover:bg-surface-50 transition-colors"
            >
              Đăng nhập để bình luận
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
