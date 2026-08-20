"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  ContentTabs,
  type ContentTabKey,
} from "@/components/admin/content/ContentTabs";
import {
  ContentFilters,
  type ContentFilterState,
} from "@/components/admin/content/ContentFilters";
import { PostsTable } from "@/components/admin/content/PostsTable";
import { CommentsTable } from "@/components/admin/content/CommentsTable";
import { MediaGrid } from "@/components/admin/content/MediaGrid";
import { PostDetailModal } from "@/components/admin/content/PostDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AdminDeletePostDialog } from "@/components/admin/dashboard/AdminDeletePostDialog";
import { Pagination } from "@/components/admin/Pagination";
import { useToast } from "@/components/ui/Toast";
import { EyeOff, Eye, Trash2 } from "lucide-react";
import type {
  AdminPostRow,
  AdminCommentRow,
  AdminMediaRow,
} from "@/lib/content/types";

type ConfirmState =
  | { kind: "hide-post"; item: AdminPostRow }
  | { kind: "hide-comment"; item: AdminCommentRow }
  | { kind: "hide-media"; item: AdminMediaRow }
  | { kind: "delete-post"; item: AdminPostRow }
  | { kind: "delete-comment"; item: AdminCommentRow }
  | { kind: "delete-media"; item: AdminMediaRow }
  | null;

type TabCounts = { posts: number; comments: number; media: number };

export default function AdminContentPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ContentTabKey) ?? "posts";
  const [tab, setTab] = useState<ContentTabKey>(initialTab);

  const [posts, setPosts] = useState<AdminPostRow[]>([]);
  const [comments, setComments] = useState<AdminCommentRow[]>([]);
  const [media, setMedia] = useState<AdminMediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [tabCounts, setTabCounts] = useState<TabCounts>({
    posts: 0,
    comments: 0,
    media: 0,
  });

  const [filters, setFilters] = useState<ContentFilterState>({
    query: "",
    status: "ALL",
    onlyReported: false,
  });
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);

  const fetchCounts = useCallback(() => {
    Promise.all([
      fetch("/api/admin/posts").then((r) => r.json()),
      fetch("/api/admin/comments").then((r) => r.json()),
      fetch("/api/admin/media").then((r) => r.json()),
    ])
      .then(([p, c, m]) => {
        setTabCounts({
          posts: p?.totalCount ?? 0,
          comments: c?.totalCount ?? 0,
          media: m?.totalCount ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, filters.query, filters.status, filters.onlyReported]);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "ALL") params.set("status", filters.status);
    if (filters.query) params.set("query", filters.query);
    if (filters.onlyReported) params.set("onlyReported", "1");
    params.set("page", String(page));
    const endpoint =
      tab === "posts"
        ? "/api/admin/posts"
        : tab === "comments"
          ? "/api/admin/comments"
          : "/api/admin/media";
    fetch(`${endpoint}?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data.items) ? data.items : [];
        if (tab === "posts") setPosts(items);
        else if (tab === "comments") setComments(items);
        else setMedia(items);
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
    fetchCounts();
  }, [tab, filters, page, fetchCounts]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const searchPlaceholder =
    tab === "posts"
      ? "Tìm theo nội dung, tác giả..."
      : tab === "comments"
        ? "Tìm theo nội dung bình luận..."
        : "Tìm theo tác giả...";

  const handleConfirm = async () => {
    if (!confirmState) return;
    setConfirmLoading(true);
    try {
      switch (confirmState.kind) {
        case "hide-post": {
          const next = confirmState.item.status !== "HIDDEN";
          const res = await fetch(`/api/admin/posts/${confirmState.item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hidden: next }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Ẩn bài viết thất bại");
          }
          showToast(next ? "Đã ẩn bài viết" : "Đã bỏ ẩn bài viết", "success");
          fetchData();
          break;
        }
        case "hide-comment": {
          const next = confirmState.item.status !== "HIDDEN";
          const res = await fetch(
            `/api/admin/comments/${confirmState.item.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hidden: next }),
            },
          );
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Ẩn bình luận thất bại");
          }
          showToast(next ? "Đã ẩn bình luận" : "Đã bỏ ẩn bình luận", "success");
          fetchData();
          break;
        }
        case "hide-media": {
          const next = confirmState.item.status !== "HIDDEN";
          const res = await fetch(`/api/admin/media/${confirmState.item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hidden: next }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Ẩn media thất bại");
          }
          showToast(next ? "Đã ẩn media" : "Đã bỏ ẩn media", "success");
          fetchData();
          break;
        }
        case "delete-comment": {
          const res = await fetch(
            `/api/admin/comments/${confirmState.item.id}`,
            { method: "DELETE" },
          );
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Xóa bình luận thất bại");
          }
          showToast("Đã xóa bình luận", "success");
          fetchData();
          break;
        }
        case "delete-media": {
          const res = await fetch(`/api/admin/media/${confirmState.item.id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Xóa media thất bại");
          }
          showToast("Đã xóa media", "success");
          fetchData();
          break;
        }
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Có lỗi xảy ra", "error");
    } finally {
      setConfirmLoading(false);
      setConfirmState(null);
    }
  };

  const isDelete = confirmState?.kind.startsWith("delete");
  const isUnhide =
    confirmState?.kind === "hide-post"
      ? confirmState.item.status === "HIDDEN"
      : confirmState?.kind === "hide-comment"
        ? confirmState.item.status === "HIDDEN"
        : confirmState?.kind === "hide-media"
          ? confirmState.item.status === "HIDDEN"
          : false;

  return (
    <>
      <PageHeader
        title="Quản lý nội dung"
        description="Quản lý bài viết, bình luận và media trên toàn hệ thống"
      />

      <ContentTabs value={tab} onChange={setTab} counts={tabCounts} />

      <ContentFilters
        value={filters}
        onChange={setFilters}
        searchPlaceholder={searchPlaceholder}
      />

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 flex items-center justify-center">
          <p className="text-sm text-slate-400">Đang tải...</p>
        </div>
      ) : (
        <>
          {tab === "posts" && (
            <PostsTable
              posts={posts}
              onViewDetail={(p) => setViewingPostId(String(p.id))}
              onToggleVisibility={(p) =>
                setConfirmState({ kind: "hide-post", item: p })
              }
              onDelete={(p) =>
                setConfirmState({ kind: "delete-post", item: p })
              }
            />
          )}
          {tab === "comments" && (
            <CommentsTable
              comments={comments}
              onToggleVisibility={(c) =>
                setConfirmState({ kind: "hide-comment", item: c })
              }
              onDelete={(c) =>
                setConfirmState({ kind: "delete-comment", item: c })
              }
            />
          )}
          {tab === "media" && (
            <MediaGrid
              items={media}
              onToggleVisibility={(m) =>
                setConfirmState({ kind: "hide-media", item: m })
              }
              onDelete={(m) =>
                setConfirmState({ kind: "delete-media", item: m })
              }
            />
          )}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {confirmState?.kind === "delete-post" ? (
        <AdminDeletePostDialog
          loading={confirmLoading}
          onConfirm={async (payload) => {
            setConfirmLoading(true);
            try {
              const res = await fetch(
                `/api/admin/posts/${confirmState.item.id}`,
                {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                },
              );
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.error ?? "Thao tác thất bại");

              showToast(
                payload.mode === "schedule-7d"
                  ? "Đã ẩn bài viết, sẽ tự xóa sau 7 ngày"
                  : "Đã xóa bài viết vĩnh viễn",
                "success",
              );
              fetchData();
            } catch (e) {
              showToast(
                e instanceof Error ? e.message : "Có lỗi xảy ra",
                "error",
              );
            } finally {
              setConfirmLoading(false);
              setConfirmState(null);
            }
          }}
          onCancel={() => setConfirmState(null)}
        />
      ) : confirmState ? (
        <ConfirmDialog
          icon={
            isDelete ? (
              <Trash2 size={20} className="text-red-500" />
            ) : isUnhide ? (
              <Eye size={20} className="text-emerald-500" />
            ) : (
              <EyeOff size={20} className="text-amber-500" />
            )
          }
          iconBgClass={
            isDelete
              ? "bg-red-100"
              : isUnhide
                ? "bg-emerald-100"
                : "bg-amber-100"
          }
          title={
            isDelete
              ? "Xóa nội dung vĩnh viễn?"
              : isUnhide
                ? "Bỏ ẩn nội dung?"
                : "Ẩn nội dung này?"
          }
          description="Hành động này sẽ áp dụng ngay lập tức và người dùng khác sẽ nhận thấy thay đổi."
          confirmLabel={
            isDelete ? "Xóa vĩnh viễn" : isUnhide ? "Bỏ ẩn" : "Ẩn nội dung"
          }
          confirmVariant={isDelete ? "danger" : "primary"}
          loading={confirmLoading}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmState(null)}
        />
      ) : null}
      {viewingPostId && (
        <PostDetailModal
          postId={viewingPostId}
          onClose={() => setViewingPostId(null)}
        />
      )}
    </>
  );
}
