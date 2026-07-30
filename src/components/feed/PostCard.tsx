"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Trash2,
  Globe,
  Users as UsersIcon,
  Lock as LockIcon,
} from "lucide-react";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import AuthGuardModal from "@/components/ui/AuthGuardModal";
import { notifyTagsChanged } from "@/lib/feed/utils";
import { blockUser } from "@/lib/block/utils";
import type { Post, ModalState } from "@/lib/feed/types";
import { handleLockedResponse } from "@/lib/feed/lockRedirect";

import RichContent from "./PostCard/RichContent";
import ImageGrid from "./PostCard/ImageGrid";
import AttachmentRow from "./PostCard/AttachmentRow";
import PostMoreMenu from "./PostCard/PostMoreMenu";
import EditPostComposer from "./PostCard/EditPostComposer";
import MediaLightbox from "./PostCard/MediaLightbox";
import CommentModal from "./PostCard/CommentModal";
import ReportPostModal from "./PostCard/ReportPostModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BlockConfirmDialog } from "@/components/feed/comment/CommentList";

export default function PostCard({
  post,
  onDeleted,
  isSavedInitially = false,
  onSaveToggle,
  autoOpenComments = false,
  targetCommentId = null,
}: {
  post: Post;
  onDeleted?: (id: string | number) => void;
  isSavedInitially?: boolean;
  onSaveToggle?: (id: string | number, saved: boolean) => void;
  autoOpenComments?: boolean;
  targetCommentId?: string | null;
}) {
  const { data: session } = useSession();
  const [sessionAvatarUrl, setSessionAvatarUrl] = useState<
    string | null | undefined
  >(undefined);

  const [liked, setLiked] = useState(post.isLikedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [content, setContent] = useState(post.content);
  const [currentImages, setCurrentImages] = useState(post.images);
  const [currentMediaTypes, setCurrentMediaTypes] = useState(post.mediaTypes);
  const [currentMediaDocIds, setCurrentMediaDocIds] = useState(
    post.mediaDocIds,
  );
  const [currentAttachment, setCurrentAttachment] = useState(post.attachment);
  const [currentAttachments, setCurrentAttachments] = useState<
    NonNullable<Post["attachment"]>[]
  >(post.attachments ?? (post.attachment ? [post.attachment] : []));
  const [editedAt, setEditedAt] = useState(post.editedAt ?? null);
  const [currentVisibility, setCurrentVisibility] = useState(post.visibility);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [saved, setSaved] = useState(isSavedInitially);
  const { showToast } = useToast();
  const [deleted, setDeleted] = useState(false);
  const [blockTarget, setBlockTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [authModal, setAuthModal] = useState<string | null>(null);

  const isOwner = session?.user?.id === post.authorId;
  const isAdmin = session?.user?.role === "ADMIN";

  const handleLike = async () => {
    if (isAdmin) return;
    if (!session?.user) {
      setAuthModal("thích bài viết");
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => (nextLiked ? c + 1 : c - 1));
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (!res.ok) {
      if (await handleLockedResponse(res)) return;
      setLiked(!nextLiked);
      setLikeCount((c) => (nextLiked ? c - 1 : c + 1));
    }
  };

  const handleSave = async () => {
    if (isAdmin) return;
    if (!session?.user) {
      setAuthModal("lưu bài viết");
      return;
    }
    const res = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setSaved(data.saved);
      showToast(
        data.saved ? "Đã lưu bài viết" : "Đã bỏ lưu bài viết",
        data.saved ? "save" : "unsave",
      );
      onSaveToggle?.(post.id, data.saved);
    } else {
      await handleLockedResponse(res);
    }
  };

  const handleEdit = (result: { content: string; updatedPost: any }) => {
    const updated = result.updatedPost;
    setContent(updated.content);
    setEditedAt(updated.editedAt);
    setCurrentVisibility(updated.visibility);
    const mediaDocs = (updated.documents ?? []).filter(
      (d: any) => d.type === "IMAGE" || d.type === "VIDEO",
    );
    const docFiles = (updated.documents ?? []).filter(
      (d: any) => d.type !== "IMAGE" && d.type !== "VIDEO",
    );
    setCurrentImages(
      mediaDocs.length ? mediaDocs.map((d: any) => d.fileUrl) : undefined,
    );
    setCurrentMediaTypes(
      mediaDocs.length
        ? mediaDocs.map((d: any) => (d.type === "VIDEO" ? "video" : "image"))
        : undefined,
    );
    setCurrentMediaDocIds(
      mediaDocs.length ? mediaDocs.map((d: any) => d.id) : undefined,
    );
    setCurrentAttachments(
      docFiles.map((d: any) => ({
        name: d.title,
        size: d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : "",
        type: d.title.split(".").pop()?.toUpperCase() ?? d.type,
        url: d.fileUrl,
        docId: d.id,
      })),
    );
    setCurrentAttachment(
      docFiles.length
        ? {
            name: docFiles[0].title,
            size: docFiles[0].fileSize
              ? `${(docFiles[0].fileSize / 1024).toFixed(1)} KB`
              : "",
            type:
              docFiles[0].title.split(".").pop()?.toUpperCase() ??
              docFiles[0].type,
            url: docFiles[0].fileUrl,
            docId: docFiles[0].id,
          }
        : undefined,
    );
    notifyTagsChanged();
    setShowEditModal(false);
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleted(true);
      onDeleted?.(post.id);
      notifyTagsChanged();
    }
    setShowDeleteConfirm(false);
  };

  const handleConfirmBlock = async () => {
    if (!blockTarget) return;
    setBlockLoading(true);
    try {
      await blockUser(blockTarget.id);
      showToast("Đã chặn người dùng", "success");
      setDeleted(true);
      onDeleted?.(post.id);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Không thể chặn người dùng",
        "error",
      );
    } finally {
      setBlockLoading(false);
      setBlockTarget(null);
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (session?.user?.id === post.authorId)
        setSessionAvatarUrl(detail.avatarUrl);
    };
    window.addEventListener("profile:updated", handler);
    return () => window.removeEventListener("profile:updated", handler);
  }, [session?.user?.id, post.authorId]);

  useEffect(() => {
    if (autoOpenComments) setModal({ type: "comment" });
  }, [autoOpenComments]);

  if (deleted) return null;

  const displayPost: Post = {
    ...post,
    content,
    images: currentImages,
    mediaTypes: currentMediaTypes,
    mediaDocIds: currentMediaDocIds,
    attachment: currentAttachment,
    author: {
      ...post.author,
      avatarUrl:
        sessionAvatarUrl !== undefined
          ? sessionAvatarUrl
          : post.author.avatarUrl,
    },
    visibility: currentVisibility,
  };

  const menuSlotProps = {
    isOwner,
    isSaved: saved,
    authorName: post.author.name,
    onSave: handleSave,
    onBlock: () =>
      setBlockTarget({ id: post.authorId, name: post.author.name }),
    onReport: () => setShowReportModal(true),
    isAdmin,
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-surface-200 shadow-card card-hover p-4">
        <div className="flex items-start justify-between mb-3">
          <NextLink
            href={
              post.author.username ? `/profile/${post.author.username}` : "#"
            }
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <Avatar
              src={displayPost.author.avatarUrl}
              name={post.author.name}
              initials={post.author.initials}
              color={post.author.color}
              size="md"
            />
            <div>
              <span className="text-sm font-semibold text-text-primary">
                {post.author.name}
              </span>
              <div className="flex items-center gap-1">
                <p className="text-xs text-text-secondary">{post.time}</p>
                {currentVisibility && (
                  <>
                    <span className="text-text-muted text-xs">·</span>
                    <span className="text-[10px] text-text-secondary flex items-center gap-0.5">
                      {currentVisibility === "PRIVATE" ? (
                        <>
                          <LockIcon size={10} /> Riêng tư
                        </>
                      ) : currentVisibility === "FRIENDS_ONLY" ? (
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
          </NextLink>
          <PostMoreMenu
            {...menuSlotProps}
            onEdit={() => setShowEditModal(true)}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        </div>

        <RichContent
          text={content}
          className="text-sm text-text-primary leading-relaxed mb-3"
        />

        {currentImages && currentImages.length > 0 && (
          <ImageGrid
            images={currentImages}
            mediaTypes={currentMediaTypes}
            onImageClick={(index) => setModal({ type: "lightbox", index })}
          />
        )}

        {currentAttachments.map((att) => (
          <AttachmentRow
            key={att.docId ?? att.name}
            attachment={att}
            className="mb-3"
          />
        ))}

        <div className="flex items-center justify-between pt-2 border-t border-surface-100">
          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              disabled={isAdmin}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all duration-150 select-none",
                liked
                  ? "bg-primary-50 text-primary font-semibold"
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
            <button
              onClick={() => setModal({ type: "comment" })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary rounded-lg hover:bg-surface-100 transition-colors"
            >
              <MessageCircle size={15} />
              <span>{commentCount}</span>
            </button>
          </div>
          {!isAdmin && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary rounded-lg hover:bg-surface-100 transition-colors">
              <Share2 size={15} />
              Chia sẻ
            </button>
          )}
        </div>
      </div>

      {modal.type === "lightbox" && currentImages && (
        <MediaLightbox
          images={currentImages}
          mediaTypes={currentMediaTypes}
          initialIndex={modal.index}
          post={displayPost}
          liked={liked}
          likeCount={likeCount}
          onClose={() => setModal({ type: "none" })}
          onLike={handleLike}
          onSyncCount={setCommentCount}
          onCountChange={(delta) =>
            setCommentCount((c) => Math.max(0, c + delta))
          }
          isAdmin={isAdmin}
          menuSlot={
            <PostMoreMenu
              {...menuSlotProps}
              onEdit={() => {
                setModal({ type: "none" });
                setShowEditModal(true);
              }}
              onDelete={() => {
                setModal({ type: "none" });
                setShowDeleteConfirm(true);
              }}
            />
          }
        />
      )}

      {modal.type === "comment" && (
        <CommentModal
          post={displayPost}
          liked={liked}
          likeCount={likeCount}
          onClose={() => setModal({ type: "none" })}
          onLike={handleLike}
          onSyncCount={setCommentCount}
          onCountChange={(delta) =>
            setCommentCount((c) => Math.max(0, c + delta))
          }
          onAuthRequired={setAuthModal}
          targetCommentId={targetCommentId}
          isAdmin={isAdmin}
          menuSlot={
            <PostMoreMenu
              {...menuSlotProps}
              onEdit={() => {
                setModal({ type: "none" });
                setShowEditModal(true);
              }}
              onDelete={() => {
                setModal({ type: "none" });
                setShowDeleteConfirm(true);
              }}
            />
          }
        />
      )}

      {showEditModal && (
        <EditPostComposer
          post={displayPost}
          attachments={currentAttachments}
          onSave={handleEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          icon={<Trash2 size={20} className="text-red-500" />}
          iconBgClass="bg-red-100"
          title="Xóa bài viết?"
          description="Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục."
          confirmLabel="Xóa"
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showReportModal && (
        <ReportPostModal
          postId={post.id}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {blockTarget && (
        <BlockConfirmDialog
          name={blockTarget.name}
          loading={blockLoading}
          onConfirm={handleConfirmBlock}
          onCancel={() => setBlockTarget(null)}
        />
      )}

      {authModal && (
        <AuthGuardModal onClose={() => setAuthModal(null)} action={authModal} />
      )}
    </>
  );
}
