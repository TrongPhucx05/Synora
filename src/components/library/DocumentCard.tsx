"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  Eye,
  MoreHorizontal,
  Bookmark,
  Flag,
  BookmarkCheck,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { FILE_TYPE_COLORS } from "@/lib/library/data";
import type { Document } from "@/lib/library/types";
import EditDocumentModal from "@/components/library/EditDocumentModal";
import { ReportModal } from "@/components/ui/ReportModal";
import { useToast } from "@/components/ui/Toast";
import {
  VIOLATION_REASON_LABELS,
  VIOLATION_REASONS,
  type ViolationReason,
} from "@/lib/admin/moderation";

interface DocumentCardProps {
  doc: Document;
  isSaved: boolean;
  isLoggedIn: boolean;
  onToggleSave: (id: string) => void;
  onReport?: (id: string) => void;
  onDownload?: () => void;
  currentUserId?: string;
  onEdited?: (updated: Partial<Document>) => void;
  onDeleted?: (id: string) => void;
  isAdmin?: boolean;
}

export default function DocumentCard({
  doc,
  isSaved,
  isLoggedIn,
  onToggleSave,
  onDownload,
  currentUserId,
  onEdited,
  onDeleted,
  isAdmin = false,
}: DocumentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [showAdminDeleteConfirm, setShowAdminDeleteConfirm] = useState(false);
  const [adminReason, setAdminReason] = useState<ViolationReason | "">("");
  const [adminNote, setAdminNote] = useState("");
  const [isAdminDeleting, setIsAdminDeleting] = useState(false);

  const { showToast } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = !!currentUserId && currentUserId === doc.uploader?.id;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleToggleSaveWithToast = () => {
    onToggleSave(doc.id);
    setMenuOpen(false);
    showToast(
      isSaved ? "Đã bỏ lưu tài liệu" : "Đã lưu tài liệu",
      isSaved ? "unsave" : "save",
    );
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/library/documents/${doc.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDeleteConfirm(false);
        showToast("Đã xóa tài liệu", "delete");
        setTimeout(() => onDeleted?.(doc.id), 500);
      } else {
        const data = await res.json();
        showToast(data.error ?? "Xóa thất bại", "error");
      }
    } catch {
      showToast("Lỗi kết nối, vui lòng thử lại", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdminDelete = async () => {
    if (!adminReason) return;
    setIsAdminDeleting(true);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: adminReason,
          note: adminNote.trim() || undefined,
        }),
      });
      if (res.ok) {
        setShowAdminDeleteConfirm(false);
        showToast("Đã xóa tài liệu vi phạm và gửi thông báo", "delete");
        setTimeout(() => onDeleted?.(doc.id), 400);
      } else {
        const data = await res.json();
        showToast(data.error ?? "Xóa thất bại", "error");
      }
    } catch {
      showToast("Lỗi kết nối, vui lòng thử lại", "error");
    } finally {
      setIsAdminDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      await fetch(`/api/library/documents/${doc.id}/download`, {
        method: "POST",
      });
      onDownload?.();
    } catch {}

    try {
      const res = await fetch(doc.fileUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.title + "." + (doc.type?.toLowerCase() ?? "pdf");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(doc.fileUrl, "_blank");
    }
  };

  const handlePreview = () => {
    const encoded = encodeURIComponent(doc.fileUrl);
    const type = doc.type?.toUpperCase();

    let viewerUrl: string;
    if (type === "PPTX" || type === "DOCX") {
      viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encoded}`;
    } else {
      viewerUrl = `https://docs.google.com/viewer?url=${encoded}`;
    }

    window.open(viewerUrl, "_blank");
  };

  const displayName =
    doc.uploader.profile?.displayName ?? doc.uploader.username;
  const initials = displayName.slice(0, 2).toUpperCase();
  const typeColor = FILE_TYPE_COLORS[doc.type.toUpperCase()] ?? "bg-gray-500";
  const formattedDownloads =
    doc.downloadCount >= 1000
      ? `${(doc.downloadCount / 1000).toFixed(1)}k`
      : String(doc.downloadCount);
  const formattedDate = new Date(doc.createdAt).toLocaleDateString("vi-VN");

  return (
    <>
      <div className="bg-white rounded-xl border border-surface-200 shadow-card hover:border-primary/30 hover:shadow-md transition-all p-4 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div
            className={clsx(
              "w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0",
              typeColor,
            )}
          >
            {doc.type.toUpperCase().slice(0, 4)}
          </div>

          {(isLoggedIn || isAdmin) && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((p) => !p)}
                aria-label="Tùy chọn"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
              >
                <MoreHorizontal size={15} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white border border-surface-200 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                  {isAdmin ? (
                    <button
                      onClick={() => {
                        setShowAdminDeleteConfirm(true);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                      Xóa tài liệu
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleToggleSaveWithToast}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:bg-surface-50 hover:text-text-primary transition-colors"
                      >
                        {isSaved ? (
                          <BookmarkCheck size={14} className="text-primary" />
                        ) : (
                          <Bookmark size={14} />
                        )}
                        {isSaved ? "Bỏ lưu" : "Lưu tài liệu"}
                      </button>

                      {isOwner ? (
                        <>
                          <div className="my-1 border-t border-surface-100" />
                          <button
                            onClick={() => {
                              setShowEditModal(true);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:bg-surface-50 hover:text-text-primary transition-colors"
                          >
                            <Pencil size={14} />
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                            Xóa tài liệu
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="my-1 border-t border-surface-100" />
                          <button
                            onClick={() => {
                              setShowReportModal(true);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Flag size={14} />
                            Báo cáo
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-8 mb-3">
          <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
            {doc.title}
          </h3>
        </div>

        <p className="text-xs text-text-muted line-clamp-2 mb-2 leading-relaxed min-h-[2rem]">
          {doc.description ?? ""}
        </p>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-secondary truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-text-muted">{formattedDate}</p>
          </div>
        </div>

        {doc.tags && doc.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 min-h-[1.5rem]">
            {doc.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 bg-surface-100 rounded text-text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {doc.subject && (
              <span className="text-xs px-2 py-0.5 bg-surface-100 rounded-full text-text-secondary font-medium whitespace-nowrap">
                {doc.subject}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
              <Download size={11} /> {formattedDownloads}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handlePreview}
              className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              <Eye size={12} />
              Xem trước
            </button>
            <button
              onClick={handleDownload}
              aria-label="Tải xuống"
              className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditDocumentModal
          doc={doc}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            setShowEditModal(false);
            onEdited?.(updated);
          }}
        />
      )}

      {showReportModal && (
        <ReportModal
          targetType="DOCUMENT"
          targetId={doc.id}
          title="Báo cáo tài liệu"
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-red-100 mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary text-center mb-1">
              Xóa tài liệu?
            </h3>
            <p className="text-xs text-text-muted text-center mb-5 leading-relaxed">
              Tài liệu{" "}
              <span className="font-medium text-text-secondary">
                "{doc.title}"
              </span>{" "}
              sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  "Xóa"
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdminDeleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-red-100 mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary text-center mb-1">
              Xóa tài liệu vi phạm?
            </h3>
            <p className="text-xs text-text-muted text-center mb-4 leading-relaxed">
              Tài liệu{" "}
              <span className="font-medium text-text-secondary">
                "{doc.title}"
              </span>{" "}
              sẽ bị xóa vĩnh viễn. Người đăng tải sẽ nhận được thông báo kèm lý
              do.
            </p>

            <div className="flex flex-col gap-1.5 mb-3">
              <label className="text-xs font-semibold text-text-primary">
                Lý do vi phạm <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={adminReason}
                  onChange={(e) =>
                    setAdminReason(e.target.value as ViolationReason)
                  }
                  className="w-full px-3 py-2.5 bg-white border border-surface-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-primary"
                >
                  <option value="">Chọn lý do...</option>
                  {VIOLATION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {VIOLATION_REASON_LABELS[r]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
              </div>
            </div>

            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              placeholder="Ghi chú thêm cho người dùng (tùy chọn)"
              className="w-full text-sm border border-surface-200 rounded-xl p-3 mb-4 resize-none focus:outline-none focus:border-primary"
            />

            <div className="flex gap-2">
              <button
                onClick={handleAdminDelete}
                disabled={isAdminDeleting || !adminReason}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
              >
                {isAdminDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  "Xóa & gửi thông báo"
                )}
              </button>
              <button
                onClick={() => setShowAdminDeleteConfirm(false)}
                disabled={isAdminDeleting}
                className="flex-1 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
