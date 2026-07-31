"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import NextLink from "next/link";
import { ThumbsUp, EyeOff, Trash2, Ban } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { Comment, CommentSort } from "@/lib/feed/types";
import CommentBubbleMenu from "./CommentBubbleMenu";
import EditCommentInput from "./EditCommentInput";
import ReplyInput from "./ReplyInput";
import { CommentMediaThumb, CommentFileBadge } from "./CommentInput";
import { useToast } from "@/components/ui/Toast";
import { ReportModal } from "@/components/ui/ReportModal";
import { blockUser } from "@/lib/block/utils";

export function BlockConfirmDialog({
  name,
  loading = false,
  onConfirm,
  onCancel,
}: {
  name: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => !loading && e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Ban size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Chặn {name}?
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Bạn sẽ không thấy bài viết, bình luận hoặc tin nhắn từ người này
              nữa.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-red-500 text-sm text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Đang chặn..." : "Chặn"}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-xl border border-surface-200 text-sm text-text-secondary hover:bg-surface-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Xóa bình luận?
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Bình luận sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-surface-200 text-sm text-text-secondary hover:bg-surface-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-red-500 text-sm text-white font-medium hover:bg-red-600 transition-colors"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommentList({
  comments,
  replyingToId,
  replyingToName,
  currentUserName,
  currentUserId,
  postAuthorId,
  onLike,
  onToggleReply,
  onSubmitReply,
  onCancelReply,
  onLikeReply,
  onDeleteComment,
  onDeleteReply,
  onHideComment,
  onCountChange,
  onEditComment,
  onAuthRequired,
  targetCommentId,
  scrollContainer,
  disabled = false,
  isAdmin = false,
  onUserBlocked,
}: {
  postAuthorId: string;
  comments: Comment[];
  replyingToId: string | null;
  replyingToName: string | null;
  currentUserName: string;
  currentUserId: string;
  onLike: (id: string) => void;
  onToggleReply: (id: string, name: string) => void;
  onSubmitReply: (commentId: string, text: string, replyTo: string) => void;
  onCancelReply: () => void;
  onLikeReply: (commentId: string, replyId: string) => void;
  onDeleteComment: (id: string) => Promise<number>;
  onDeleteReply: (commentId: string, replyId: string) => void;
  onHideComment: (id: string) => void;
  onCountChange?: (delta: number) => void;
  onEditComment: (id: string, text: string) => void;
  onAuthRequired?: (action: string) => void;
  targetCommentId?: string | null;
  scrollContainer?: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  isAdmin?: boolean;
  onUserBlocked?: (authorId: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState<"comment" | "reply" | null>(
    null,
  );
  const [deletingParentId, setDeletingParentId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [blockingTarget, setBlockingTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set<string>(),
  );
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [reportingTarget, setReportingTarget] = useState<{
    type: "COMMENT";
    id: string;
  } | null>(null);
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const REPLIES_PREVIEW = 2;

  useEffect(() => {
    if (!targetCommentId || comments.length === 0) return;
    const isTopLevel = comments.some((c) => c.id === targetCommentId);
    if (!isTopLevel) {
      const parentComment = comments.find((c) =>
        c.replies.some((r) => r.id === targetCommentId),
      );
      if (!parentComment) return;
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        next.add(parentComment.id);
        return next;
      });
    }
    const rafId = requestAnimationFrame(() => {
      const el = commentRefs.current[targetCommentId];
      const container = scrollContainer?.current;
      if (!el) return;
      if (container) {
        const containerTop = container.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        const offset = elTop - containerTop + container.scrollTop - 80;
        container.scrollTop = offset;
      } else {
        el.scrollIntoView({ block: "center" });
      }
      setHighlightedId(targetCommentId);
      setTimeout(() => setHighlightedId(null), 2000);
    });
    return () => cancelAnimationFrame(rafId);
  }, [targetCommentId, comments, scrollContainer]);

  const handleConfirmBlock = async () => {
    if (!blockingTarget) return;
    setBlockLoading(true);
    try {
      await blockUser(blockingTarget.id);
      showToast("Đã chặn người dùng", "success");
      const removed = comments.reduce((acc, c) => {
        let count = 0;
        if (c.authorId === blockingTarget.id && !c.hidden) count += 1;
        count += c.replies.filter(
          (r) => r.authorId === blockingTarget.id && !r.hidden,
        ).length;
        return acc + count;
      }, 0);
      onCountChange?.(-removed);
      onUserBlocked?.(blockingTarget.id);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Không thể chặn người dùng",
        "error",
      );
    } finally {
      setBlockLoading(false);
      setBlockingTarget(null);
    }
  };

  return (
    <>
      {comments.length === 0 && (
        <p className="text-center text-sm text-text-secondary py-10">
          Chưa có bình luận nào. Hãy là người đầu tiên!
        </p>
      )}
      {comments
        .filter(
          (c) =>
            !c.hidden ||
            currentUserId === postAuthorId ||
            currentUserId === c.authorId,
        )
        .map((c) => (
          <div
            key={c.id}
            data-comment-id={c.id}
            ref={(el) => {
              commentRefs.current[c.id] = el;
            }}
            className={clsx(
              "transition-colors duration-700 rounded-xl",
              highlightedId === c.id && "bg-blue-50",
            )}
          >
            {c.hidden && currentUserId === postAuthorId && (
              <div className="flex items-center gap-1 mb-1 ml-1">
                <EyeOff size={11} className="text-text-muted" />
                <span className="text-[10px] text-text-muted italic">
                  Bình luận đã bị ẩn
                </span>
              </div>
            )}
            {c.hidden &&
              currentUserId === c.authorId &&
              currentUserId !== postAuthorId && (
                <div className="flex items-center gap-1 mb-1 ml-1">
                  <EyeOff size={11} className="text-text-muted" />
                  <span className="text-[10px] text-text-muted italic">
                    Bình luận của bạn đã bị ẩn
                  </span>
                </div>
              )}
            <div className="flex gap-2.5 items-start group/comment">
              <NextLink
                href={c.author.username ? `/profile/${c.author.username}` : "#"}
              >
                <Avatar
                  src={c.author.avatarUrl}
                  name={c.author.name}
                  initials={c.author.initials}
                  color={c.author.color}
                  size="sm"
                />
              </NextLink>
              <div className="min-w-0 max-w-[85%]">
                <div className="relative">
                  <div
                    className={clsx(
                      "bg-surface-100 rounded-2xl rounded-tl-sm px-3 py-2.5",
                      c.hidden && "opacity-50",
                    )}
                  >
                    <span className="text-xs font-semibold text-text-primary">
                      {c.author.name}
                    </span>
                    <span className="text-[10px] text-text-secondary ml-1.5">
                      {c.time}
                    </span>
                    {c.editedAt && (
                      <span className="text-[10px] text-text-secondary ml-1">
                        · đã chỉnh sửa
                      </span>
                    )}
                    <p className="text-sm text-text-primary leading-relaxed mt-0.5">
                      {c.content}
                    </p>
                    {c.imageUrl && (
                      <CommentMediaThumb
                        url={c.imageUrl}
                        type="image"
                        fileName={c.fileName}
                      />
                    )}
                    {c.videoUrl && (
                      <CommentMediaThumb
                        url={c.videoUrl}
                        type="video"
                        fileName={c.fileName}
                      />
                    )}
                    {c.fileName &&
                      !c.imageUrl &&
                      !c.videoUrl &&
                      (() => {
                        const ext = (c.fileType ?? "").toUpperCase();
                        const isVid = [
                          "MP4",
                          "MOV",
                          "AVI",
                          "WEBM",
                          "MKV",
                        ].includes(ext);
                        const isImg = [
                          "JPG",
                          "JPEG",
                          "PNG",
                          "GIF",
                          "WEBP",
                          "BMP",
                          "SVG",
                        ].includes(ext);
                        if (isVid && c.fileUrl)
                          return (
                            <CommentMediaThumb
                              url={c.fileUrl}
                              type="video"
                              fileName={c.fileName}
                            />
                          );
                        if (isImg && c.fileUrl)
                          return (
                            <CommentMediaThumb
                              url={c.fileUrl}
                              type="image"
                              fileName={c.fileName}
                            />
                          );
                        return (
                          <CommentFileBadge
                            name={c.fileName}
                            size={c.fileSize}
                            type={c.fileType}
                            url={c.fileUrl}
                          />
                        );
                      })()}
                  </div>
                  <div className="absolute -right-8 top-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                    {!isAdmin && (
                      <CommentBubbleMenu
                        role={
                          currentUserId === c.authorId
                            ? c.hidden
                              ? "hidden-own"
                              : "own"
                            : currentUserId === postAuthorId
                              ? "post-author"
                              : "viewer"
                        }
                        authorName={c.author.name}
                        onEdit={() => setEditingId(c.id)}
                        onDelete={() => {
                          setDeletingId(c.id);
                          setDeletingType("comment");
                          setDeletingParentId(null);
                        }}
                        isHidden={c.hidden}
                        onHide={() => onHideComment(c.id)}
                        onBlock={() =>
                          setBlockingTarget({
                            id: c.authorId,
                            name: c.author.name,
                          })
                        }
                        onReport={() =>
                          setReportingTarget({ type: "COMMENT", id: c.id })
                        }
                      />
                    )}
                  </div>
                </div>
                {editingId === c.id && (
                  <div>
                    {(c.imageUrl || c.videoUrl || c.fileName) && (
                      <div className="mt-1 mb-1 opacity-60 pointer-events-none">
                        {c.imageUrl && (
                          <CommentMediaThumb
                            url={c.imageUrl}
                            type="image"
                            fileName={c.fileName}
                          />
                        )}
                        {c.videoUrl && (
                          <CommentMediaThumb
                            url={c.videoUrl}
                            type="video"
                            fileName={c.fileName}
                          />
                        )}
                        {c.fileName && !c.imageUrl && !c.videoUrl && (
                          <CommentFileBadge
                            name={c.fileName}
                            size={c.fileSize}
                            type={c.fileType}
                            url={c.fileUrl}
                          />
                        )}
                      </div>
                    )}
                    <EditCommentInput
                      initialText={c.content}
                      onSave={(text) => {
                        onEditComment(c.id, text);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                )}
                {editingId !== c.id &&
                  !(
                    c.hidden &&
                    currentUserId === c.authorId &&
                    currentUserId !== postAuthorId
                  ) && (
                    <div
                      className={clsx(
                        "flex items-center gap-1 mt-1 ml-1",
                        c.hidden && "opacity-50",
                      )}
                    >
                      {!c.hidden && !isAdmin && (
                        <button
                          onClick={() => {
                            if (!currentUserId) {
                              onAuthRequired?.("thích bình luận");
                              return;
                            }
                            onLike(c.id);
                          }}
                          className={clsx(
                            "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-colors",
                            c.liked
                              ? "text-primary"
                              : "text-text-secondary hover:text-text-secondary",
                          )}
                        >
                          <ThumbsUp size={11} />
                          <span>{c.likes > 0 ? c.likes : "Thích"}</span>
                        </button>
                      )}
                      {!c.hidden && !isAdmin && (
                        <button
                          onClick={() => {
                            if (!currentUserId) {
                              onAuthRequired?.("trả lời bình luận");
                              return;
                            }
                            if (disabled) return;
                            onToggleReply(c.id, c.author.name);
                          }}
                          className={clsx(
                            "text-[11px] font-medium px-2 py-0.5 rounded transition-colors",
                            disabled
                              ? "text-text-muted cursor-not-allowed"
                              : "text-text-secondary hover:text-text-secondary",
                          )}
                        >
                          Trả lời
                        </button>
                      )}
                    </div>
                  )}
              </div>
            </div>
            {c.replies.length > 0 &&
              (!c.hidden || currentUserId === postAuthorId) && (
                <div className="ml-10 mt-2 flex flex-col gap-2">
                  {(expandedReplies.has(c.id)
                    ? c.replies
                    : c.replies.slice(0, REPLIES_PREVIEW)
                  ).map((r) => (
                    <div
                      key={r.id}
                      ref={(el) => {
                        commentRefs.current[r.id] = el;
                      }}
                      className={clsx(
                        "flex gap-2 items-start group/reply transition-colors duration-700 rounded-xl",
                        highlightedId === r.id && "bg-blue-50",
                      )}
                    >
                      <NextLink
                        href={
                          r.author.username
                            ? `/profile/${r.author.username}`
                            : "#"
                        }
                      >
                        <Avatar
                          src={r.author.avatarUrl}
                          name={r.author.name}
                          initials={r.author.initials}
                          color={r.author.color}
                        />
                      </NextLink>
                      <div className="min-w-0 max-w-[85%]">
                        <div className="relative">
                          <div
                            className={clsx(
                              "bg-surface-50 rounded-2xl rounded-tl-sm px-3 py-2",
                              r.hidden && "opacity-50",
                            )}
                          >
                            <span className="text-xs font-semibold text-text-primary">
                              {r.author.name}
                            </span>
                            <span className="text-[10px] text-text-secondary ml-1.5">
                              {r.time}
                            </span>
                            <p className="text-sm text-text-primary leading-relaxed mt-0.5">
                              {r.replyTo && (
                                <span className="text-primary font-medium">
                                  @{r.replyTo}{" "}
                                </span>
                              )}
                              {r.content}
                            </p>
                          </div>
                          <div className="absolute -right-8 top-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                            {!isAdmin && (
                              <CommentBubbleMenu
                                role={
                                  currentUserId === r.authorId
                                    ? "own"
                                    : currentUserId === postAuthorId
                                      ? "post-author"
                                      : "viewer"
                                }
                                authorName={r.author.name}
                                onEdit={() => {}}
                                onDelete={() => {
                                  setDeletingId(r.id);
                                  setDeletingType("reply");
                                  setDeletingParentId(c.id);
                                }}
                                isHidden={c.hidden}
                                onHide={() => {}}
                                onBlock={() =>
                                  setBlockingTarget({
                                    id: r.authorId,
                                    name: r.author.name,
                                  })
                                }
                                onReport={() =>
                                  setReportingTarget({
                                    type: "COMMENT",
                                    id: r.id,
                                  })
                                }
                              />
                            )}
                          </div>
                        </div>
                        <div
                          className={clsx(
                            "flex items-center gap-1 mt-1 ml-1",
                            r.hidden && "opacity-50",
                          )}
                        >
                          {!c.hidden && !isAdmin && (
                            <button
                              onClick={() => {
                                if (!currentUserId) {
                                  onAuthRequired?.("thích bình luận");
                                  return;
                                }
                                if (disabled) return;
                                onLikeReply(c.id, r.id);
                              }}
                              className={clsx(
                                "text-[11px] font-medium px-2 py-0.5 rounded transition-colors",
                                disabled
                                  ? "text-text-muted cursor-not-allowed"
                                  : "text-text-secondary hover:text-text-secondary",
                              )}
                            >
                              <ThumbsUp size={11} />
                              <span>{r.likes > 0 ? r.likes : "Thích"}</span>
                            </button>
                          )}
                          {!c.hidden && !isAdmin && (
                            <button
                              onClick={() => {
                                if (!currentUserId) {
                                  onAuthRequired?.("trả lời bình luận");
                                  return;
                                }
                                onToggleReply(c.id, c.author.name);
                              }}
                              className="text-[11px] font-medium text-text-secondary hover:text-text-secondary px-2 py-0.5 rounded transition-colors"
                            >
                              Trả lời
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!expandedReplies.has(c.id) &&
                    c.replies.length > REPLIES_PREVIEW && (
                      <button
                        onClick={() =>
                          setExpandedReplies((prev) => {
                            const next = new Set(prev);
                            next.add(c.id);
                            return next;
                          })
                        }
                        className="text-[11px] font-medium text-primary hover:underline text-left mt-0.5"
                      >
                        Xem thêm {c.replies.length - REPLIES_PREVIEW} câu trả
                        lời
                      </button>
                    )}
                  {expandedReplies.has(c.id) &&
                    c.replies.length > REPLIES_PREVIEW && (
                      <button
                        onClick={() =>
                          setExpandedReplies((prev) => {
                            const next = new Set(prev);
                            next.delete(c.id);
                            return next;
                          })
                        }
                        className="text-[11px] font-medium text-text-secondary hover:underline text-left mt-0.5"
                      >
                        Thu gọn
                      </button>
                    )}
                </div>
              )}
            {replyingToId === c.id && !c.hidden && !isAdmin && (
              <ReplyInput
                key={replyingToName ?? c.author.name}
                replyTo={replyingToName ?? c.author.name}
                isSelf={currentUserName === (replyingToName ?? c.author.name)}
                onSubmit={(text) =>
                  onSubmitReply(c.id, text, replyingToName ?? c.author.name)
                }
                onCancel={onCancelReply}
                disabled={disabled}
              />
            )}
          </div>
        ))}
      {deletingId && (
        <DeleteConfirmDialog
          onConfirm={async () => {
            if (deletingType === "reply" && deletingParentId) {
              onDeleteReply(deletingParentId, deletingId);
              onCountChange?.(-1);
            } else {
              const totalDeleted = await onDeleteComment(deletingId);
              onCountChange?.(-(totalDeleted ?? 1));
            }
            setDeletingId(null);
            setDeletingType(null);
            setDeletingParentId(null);
          }}
          onCancel={() => {
            setDeletingId(null);
            setDeletingType(null);
            setDeletingParentId(null);
          }}
        />
      )}
      {blockingTarget && (
        <BlockConfirmDialog
          name={blockingTarget.name}
          loading={blockLoading}
          onConfirm={handleConfirmBlock}
          onCancel={() => setBlockingTarget(null)}
        />
      )}
      {reportingTarget && (
        <ReportModal
          targetType={reportingTarget.type}
          targetId={reportingTarget.id}
          onClose={() => setReportingTarget(null)}
        />
      )}
    </>
  );
}
