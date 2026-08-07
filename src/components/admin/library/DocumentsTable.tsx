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
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
        Không tìm thấy tài liệu nào phù hợp
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-slate-400 text-xs uppercase tracking-wide">
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
              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
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
                    <p className="font-medium text-slate-700 leading-tight truncate max-w-[140px]">
                      {doc.author.name}
                    </p>
                    <p className="text-xs text-slate-400 leading-tight truncate max-w-[140px]">
                      @{doc.author.username}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 max-w-[260px]">
                <p className="text-slate-700 font-medium truncate">
                  {doc.title}
                </p>
                {doc.subject && (
                  <p className="text-xs text-slate-400 truncate">
                    {doc.subject}
                  </p>
                )}
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                {doc.type}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <Download size={12} /> {doc.downloadCount}
                </span>
              </td>
              <td className="px-5 py-3 text-center whitespace-nowrap">
                {doc.reportCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                    <Flag size={12} /> {doc.reportCount}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                {doc.status === "VISIBLE" ? (
                  <span className="text-[11px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Hiển thị
                  </span>
                ) : (
                  <span className="text-[11px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Đã ẩn
                  </span>
                )}
              </td>
              <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
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
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  >
                    <ExternalLink size={15} />
                  </button>
                  <button
                    onClick={() => onToggleVisibility(doc)}
                    title={doc.status === "VISIBLE" ? "Ẩn tài liệu" : "Bỏ ẩn"}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
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
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
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
