"use client";
import { EyeOff, Eye, Trash2, Flag } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { AdminCommentRow } from "@/lib/content/types";

export function CommentsTable({
  comments,
  onToggleVisibility,
  onDelete,
}: {
  comments: AdminCommentRow[];
  onToggleVisibility: (c: AdminCommentRow) => void;
  onDelete: (c: AdminCommentRow) => void;
}) {
  if (comments.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-surface-200 p-10 text-center text-sm text-text-muted">
        Không tìm thấy bình luận nào phù hợp
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-surface-200 divide-y divide-surface-50">
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-3 px-5 py-4">
          <Avatar
            src={c.author.avatarUrl}
            name={c.author.name}
            initials={c.author.initials}
            color={c.author.color}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-secondary">
                {c.author.name}
              </p>
              <span className="text-xs text-text-muted">
                @{c.author.username}
              </span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-muted">{c.createdAt}</span>
              {c.status === "HIDDEN" && (
                <span className="text-[11px] font-medium bg-surface-100 text-text-muted px-2 py-0.5 rounded-full">
                  Đã ẩn
                </span>
              )}
              {c.reportCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400 font-medium">
                  <Flag size={11} /> {c.reportCount} báo cáo
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-1">{c.content}</p>
            <p className="text-xs text-text-muted mt-1.5 truncate">
              Trong bài viết: <span className="italic">"{c.postExcerpt}"</span>
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleVisibility(c)}
              title={c.status === "VISIBLE" ? "Ẩn bình luận" : "Bỏ ẩn"}
              className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-secondary"
            >
              {c.status === "VISIBLE" ? (
                <EyeOff size={15} />
              ) : (
                <Eye size={15} />
              )}
            </button>
            <button
              onClick={() => onDelete(c)}
              title="Xóa vĩnh viễn"
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-text-muted hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
