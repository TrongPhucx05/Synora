"use client";
import { Eye, EyeOff, Trash2, MoreVertical, Flag } from "lucide-react";
import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Avatar from "@/components/ui/Avatar";
import type { AdminPostRow } from "@/lib/content/types";
import { clsx } from "clsx";

function StatusBadge({ status }: { status: AdminPostRow["status"] }) {
  return status === "VISIBLE" ? (
    <span className="text-[11px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full whitespace-nowrap">
      Hiển thị
    </span>
  ) : (
    <span className="text-[11px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full whitespace-nowrap">
      Đã ẩn
    </span>
  );
}

function RowMenu({
  post,
  onViewDetail,
  onToggleVisibility,
  onDelete,
}: {
  post: AdminPostRow;
  onViewDetail: (p: AdminPostRow) => void;
  onToggleVisibility: (p: AdminPostRow) => void;
  onDelete: (p: AdminPostRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: -9999,
    left: -9999,
    visibility: "hidden",
  });

  const updatePosition = useCallback(() => {
    const btn = btnRef.current;
    const menu = menuRef.current;
    if (!btn || !menu) return;

    const btnRect = btn.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const margin = 4;

    const spaceBelow = window.innerHeight - btnRect.bottom;
    const placeAbove = spaceBelow < menuRect.height + margin;

    const top = placeAbove
      ? btnRect.top - menuRect.height - margin
      : btnRect.bottom + margin;

    let left = btnRect.right - menuRect.width;
    const maxLeft = window.innerWidth - menuRect.width - margin;
    left = Math.max(margin, Math.min(left, maxLeft));

    setStyle({ position: "fixed", top, left, visibility: "visible" });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
      >
        <MoreVertical size={16} />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={style}
            className="w-[190px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-1"
          >
            <button
              onClick={() => {
                onViewDetail(post);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Eye size={14} /> Xem chi tiết
            </button>
            <button
              onClick={() => {
                onToggleVisibility(post);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <EyeOff size={14} />
              {post.status === "VISIBLE" ? "Ẩn bài viết" : "Bỏ ẩn bài viết"}
            </button>
            <div className="h-px bg-slate-100 my-1" />
            <button
              onClick={() => {
                onDelete(post);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <Trash2 size={14} /> Xóa vĩnh viễn
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

export function PostsTable({
  posts,
  onViewDetail,
  onToggleVisibility,
  onDelete,
}: {
  posts: AdminPostRow[];
  onViewDetail: (p: AdminPostRow) => void;
  onToggleVisibility: (p: AdminPostRow) => void;
  onDelete: (p: AdminPostRow) => void;
}) {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
        Không tìm thấy bài viết nào phù hợp
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[880px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-slate-400 text-xs uppercase tracking-wide">
            <th className="px-5 py-3 font-medium">Tác giả</th>
            <th className="px-5 py-3 font-medium">Nội dung</th>
            <th className="px-5 py-3 font-medium text-center whitespace-nowrap">Bình luận</th>
            <th className="px-5 py-3 font-medium text-center whitespace-nowrap">Lượt thích</th>
            <th className="px-5 py-3 font-medium text-center whitespace-nowrap">Báo cáo</th>
            <th className="px-5 py-3 font-medium whitespace-nowrap">Trạng thái</th>
            <th className="px-5 py-3 font-medium whitespace-nowrap">Ngày đăng</th>
            <th className="px-5 py-3 font-medium w-12" />
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar src={post.author.avatarUrl} name={post.author.name} initials={post.author.initials} color={post.author.color} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 leading-tight truncate max-w-[140px]">
                      {post.author.name}
                    </p>
                    <p className="text-xs text-slate-400 leading-tight truncate max-w-[140px]">
                      @{post.author.username}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 max-w-[240px]">
                <p className="text-slate-600 truncate">{post.excerpt}</p>
                {post.imageCount > 0 && (
                  <p className="text-xs text-slate-400 whitespace-nowrap">{post.imageCount} ảnh/video</p>
                )}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 whitespace-nowrap">{post.commentCount}</td>
              <td className="px-5 py-3 text-center text-slate-600 whitespace-nowrap">{post.likeCount}</td>
              <td className="px-5 py-3 text-center whitespace-nowrap">
                {post.reportCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                    <Flag size={12} /> {post.reportCount}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <StatusBadge status={post.status} />
              </td>
              <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{post.createdAt}</td>
              <td className="px-5 py-3 whitespace-nowrap">
                <RowMenu
                  post={post}
                  onViewDetail={onViewDetail}
                  onToggleVisibility={onToggleVisibility}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}