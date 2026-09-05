"use client";
import {
  Eye,
  EyeOff,
  Trash2,
  Flag,
  Download,
  ExternalLink,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { AdminDocumentRow } from "@/lib/content/types";

function getViewerUrl(fileUrl: string, type: string) {
  const encoded = encodeURIComponent(fileUrl);
  const t = type?.toUpperCase();
  if (t === "PPTX" || t === "DOCX") {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encoded}`;
  }
  return `https://docs.google.com/viewer?url=${encoded}`;
}

export function DocumentsTable({
  documents,
  onToggleVisibility,
  onDelete,
}: {
  documents: AdminDocumentRow[];
  onToggleVisibility: (d: AdminDocumentRow) => void;
  onDelete: (d: AdminDocumentRow) => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-surface-200 p-10 text-center text-sm text-text-muted">
        Không tìm thấy tài liệu nào phù hợp
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-surface-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b border-surface-100 text-left text-text-muted text-xs uppercase tracking-wide">
            <th className="px-5 py-3 font-medium">Người tải lên</th>
            <th className="px-5 py-3 font-medium">Tài liệu</th>
            <th className="px-5 py-3 font-medium whitespace-nowrap">Loại</th>
            <th className="px-5 py-3 font-medium text-center whitespace-nowrap">
              Lượt tải
            </th>
            <th className="px-5 py-3 font-medium text-center whitespace-nowrap">
              Báo cáo
            </th>
            <th className="px-5 py-3 font-medium whitespace-nowrap">
              Trạng thái
            </th>
            <th className="px-5 py-3 font-medium whitespace-nowrap">
              Ngày đăng
            </th>
            <th className="px-5 py-3 font-medium w-[110px]" />
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="border-b border-surface-100 last:border-0 hover:bg-surface-50"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={doc.author.avatarUrl}
                    name={doc.author.name}
                    initials={doc.author.initials}
                    color={doc.author.color}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-text-secondary leading-tight truncate max-w-[140px]">
                      {doc.author.name}
                    </p>
                    <p className="text-xs text-text-muted leading-tight truncate max-w-[140px]">
                      @{doc.author.username}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 max-w-[260px]">
                <p className="text-text-secondary font-medium truncate">
                  {doc.title}
                </p>
                {doc.subject && (
                  <p className="text-xs text-text-muted truncate">
                    {doc.subject}
                  </p>
                )}
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                {doc.type}
              </td>
              <td className="px-5 py-3 text-center text-text-secondary whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <Download size={12} /> {doc.downloadCount}
                </span>
              </td>
              <td className="px-5 py-3 text-center whitespace-nowrap">
                {doc.reportCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                    <Flag size={12} /> {doc.reportCount}
                  </span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                {doc.status === "VISIBLE" ? (
                  <span className="text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Hiển thị
                  </span>
                ) : (
                  <span className="text-[11px] font-medium bg-surface-100 text-text-muted px-2 py-0.5 rounded-full whitespace-nowrap">
                    Đã ẩn
                  </span>
                )}
              </td>
              <td className="px-5 py-3 text-text-muted whitespace-nowrap">
                {doc.createdAt}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        getViewerUrl(doc.fileUrl, doc.type),
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    title="Xem tài liệu"
                    className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-secondary"
                  >
                    <ExternalLink size={15} />
                  </button>
                  <button
                    onClick={() => onToggleVisibility(doc)}
                    title={doc.status === "VISIBLE" ? "Ẩn tài liệu" : "Bỏ ẩn"}
                    className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-secondary"
                  >
                    {doc.status === "VISIBLE" ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                  <button
                    onClick={() => onDelete(doc)}
                    title="Xóa vĩnh viễn"
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-text-muted hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
