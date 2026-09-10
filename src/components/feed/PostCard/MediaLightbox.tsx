"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  MessageCircle,
  Share2,
  Globe,
  Users as UsersIcon,
  Lock as LockIcon,
} from "lucide-react";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Avatar from "@/components/ui/Avatar";
import AuthGuardModal from "@/components/ui/AuthGuardModal";
import { useComments } from "@/lib/feed/hooks";
import { isVideoItem } from "@/lib/feed/utils";
import type { Post, CommentSort } from "@/lib/feed/types";
import RichContent from "./RichContent";
import AttachmentRow from "./AttachmentRow";
import CommentList from "@/components/feed/comment/CommentList";
import CommentInput from "@/components/feed/comment/CommentInput";

export default function MediaLightbox({
  images,
  mediaTypes,
  initialIndex,
  post,
  liked,
  likeCount,
  onClose,
  onLike,
  onCountChange,
  onSyncCount,
  menuSlot,
  isAdmin = false,
}: {
  images: string[];
  mediaTypes?: string[];
  initialIndex: number;
  post: Post;
  liked: boolean;
  likeCount: number;
  onClose: () => void;
  onLike: () => void;
  onCountChange?: (delta: number) => void;
  onSyncCount?: (count: number) => void;
  menuSlot?: React.ReactNode;
  isAdmin?: boolean;
}) {
  const [index, setIndex] = useState(initialIndex);
  const { data: session, status } = useSession();
  const t = useTranslations("post");
  const [sort, setSort] = useState<CommentSort>("default");
  const [authModal, setAuthModal] = useState<string | null>(null);

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
  } = useComments(post.id, sort);

  const handleSubmitReply = (
    commentId: string,
    text: string,
    replyTo: string,
  ) => {
    if (isAdmin) return;
    submitReply(commentId, text, replyTo);
  };

  const prev = () => setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    onSyncCount?.(getVisibleCount());
  }, [comments, getVisibleCount, onSyncCount]);

  const currentSrc = images[index];
  const isVideo = isVideoItem(currentSrc, mediaTypes?.[index]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex" onClick={onClose}>
      <div
        className="flex-1 flex items-center justify-center relative"
        style={{ height: "100vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"
        >
          <X size={16} />
        </button>

        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          {isVideo ? (
            <video
              key={currentSrc}
              src={currentSrc}
              controls
              autoPlay
              className="object-contain"
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <img
              src={currentSrc}
              alt=""
              className="object-contain"
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={clsx(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === index ? "bg-surface scale-125" : "bg-white/40",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div
        className="w-[380px] shrink-0 bg-surface flex flex-col"
        style={{ height: "100vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100 shrink-0">
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
          <div className="flex-1">
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
                        <LockIcon size={10} /> {t("visibility.private")}
                      </>
                    ) : post.visibility === "FRIENDS_ONLY" ? (
                      <>
                        <UsersIcon size={10} /> {t("visibility.friends")}
                      </>
                    ) : (
                      <>
                        <Globe size={10} /> {t("visibility.public")}
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
          {menuSlot}
        </div>

        <div className="px-4 pt-3 pb-2 shrink-0">
          <RichContent
            text={post.content}
            className="text-sm text-text-primary leading-relaxed"
          />
          {post.attachment && (
            <AttachmentRow attachment={post.attachment} className="mt-2" />
          )}
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 border-y border-surface-100 shrink-0">
          <button
            onClick={onLike}
            disabled={isAdmin}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              liked
                ? "text-primary font-semibold"
                : "text-text-secondary hover:bg-surface-100",
              isAdmin && "opacity-40 cursor-not-allowed",
            )}
          >
            <ThumbsUp
              size={15}
              className={clsx(
                "transition-transform duration-150",
                liked ? "fill-primary scale-110" : "",
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
              <span>{t("share")}</span>
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
                ? t("comments.sort.default")
                : s === "newest"
                  ? t("comments.sort.newest")
                  : t("comments.sort.oldest")}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-visible px-4 pr-12 py-3 flex flex-col gap-3">
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
            onHideComment={hideComment}
            onCountChange={onCountChange}
            onAuthRequired={setAuthModal}
            disabled={commentsLoading}
            isAdmin={isAdmin}
          />
        </div>

        <div className="border-t border-surface-100 px-4 py-3 shrink-0">
          {isAdmin ? (
            <p className="w-full py-2.5 text-center text-xs font-medium text-text-secondary bg-surface-50 rounded-2xl">
              {t("comments.adminCannotComment")}
            </p>
          ) : status === "authenticated" ? (
            <CommentInput
              onSubmit={async (payload) => {
                await submitComment(payload);
              }}
              disabled={commentsLoading}
            />
          ) : (
            <button
              onClick={() => setAuthModal(t("comments.commentAction"))}
              className="w-full py-2.5 text-xs font-medium text-text-secondary border border-surface-200 rounded-2xl hover:bg-surface-50 transition-colors"
            >
              {t("comments.loginToComment")}
            </button>
          )}
        </div>
      </div>

      {authModal && (
        <div onClick={(e) => e.stopPropagation()}>
          <AuthGuardModal
            onClose={() => setAuthModal(null)}
            action={authModal}
          />
        </div>
      )}
    </div>
  );
}
