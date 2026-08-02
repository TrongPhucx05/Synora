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
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
        Không tìm thấy bình luận nào phù hợp
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50">
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
              <p className="text-sm font-medium text-slate-700">
                {c.author.name}
              </p>
              <span className="text-xs text-slate-400">
                @{c.author.username}
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-400">{c.createdAt}</span>
              {c.status === "HIDDEN" && (
                <span className="text-[11px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  Đã ẩn
                </span>
              )}
              {c.reportCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-medium">
                  <Flag size={11} /> {c.reportCount} báo cáo
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">{c.content}</p>
            <p className="text-xs text-slate-400 mt-1.5 truncate">
              Trong bài viết: <span className="italic">"{c.postExcerpt}"</span>
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleVisibility(c)}
              title={c.status === "VISIBLE" ? "Ẩn bình luận" : "Bỏ ẩn"}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
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
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
