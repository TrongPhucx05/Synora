"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Paperclip,
  ImageIcon,
  Video,
  FileText,
  Loader2,
  Globe,
  ChevronDown,
  Users as UsersIcon,
  Lock as LockIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useUploadThing } from "@/lib/uploadthing";
import {
  isImageType,
  isVideoType,
  formatFileSize as composerFormatFileSize,
  getFileType,
  MediaPreview,
  FileChip,
  MediaLightboxPreview,
  ActionButton,
  type AttachedFile as ComposerAttachedFile,
} from "@/components/feed/PostComposer";
import type { Post, EditVisibility, ExistingMedia } from "@/lib/feed/types";

function getEditVisibilityOptions(t: ReturnType<typeof useTranslations>) {
  return [
    {
      value: "PUBLIC" as EditVisibility,
      label: t("post.composer.visibility.public"),
      icon: <Globe size={13} />,
    },
    {
      value: "FRIENDS_ONLY" as EditVisibility,
      label: t("post.composer.visibility.friends"),
      icon: <UsersIcon size={13} />,
    },
    {
      value: "PRIVATE" as EditVisibility,
      label: t("post.composer.visibility.private"),
      icon: <LockIcon size={13} />,
    },
  ];
}

function EditVisibilityPicker({
  value,
  onChange,
}: {
  value: EditVisibility;
  onChange: (v: EditVisibility) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations();
  const options = getEditVisibilityOptions(t);
  const current = options.find((o) => o.value === value)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 px-2.5 py-1.5 rounded-full transition-colors"
      >
        {current.icon}
        {current.label}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-surface border border-surface-200 rounded-xl shadow-lg z-30 min-w-[160px] overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-50 transition-colors ${
                opt.value === value
                  ? "text-primary font-semibold"
                  : "text-text-primary"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditPostComposer({
  post,
  attachments,
  onSave,
  onClose,
}: {
  post: Post;
  attachments?: NonNullable<Post["attachment"]>[];
  onSave: (result: { content: string; updatedPost: any }) => void;
  onClose: () => void;
}) {
  const [content, setContent] = useState(post.content);
  const [visibility, setVisibility] = useState<EditVisibility>(
    (post.visibility as EditVisibility) ?? "PUBLIC",
  );
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>(
    (post.images ?? []).map((url, i) => ({
      id: post.mediaDocIds?.[i] ?? `existing-${i}`,
      url,
      type: post.mediaTypes?.[i] === "video" ? "VIDEO" : "IMAGE",
      name: url.split("/").pop() ?? `media-${i}`,
    })),
  );
  const [existingAttachments, setExistingAttachments] = useState<
    NonNullable<Post["attachment"]>[]
  >(attachments ?? (post.attachment ? [post.attachment] : []));
  const [newFiles, setNewFiles] = useState<ComposerAttachedFile[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [removedDocIds, setRemovedDocIds] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const MAX_IMG_MB = 8;
  const MAX_VID_MB = 64;
  const MAX_DOC_MB = 32;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageVideoInputRef = useRef<HTMLInputElement>(null);

  const { startUpload: startMediaUpload } = useUploadThing("postMedia");
  const { startUpload: startDocUpload } = useUploadThing("postDocument");

  const charLimit = 1000;
  const isOverLimit = content.length > charLimit;
  const canSave = content.trim().length > 0 && !isOverLimit && !saving;

  const newMediaFiles = newFiles.filter(
    (f) => isImageType(f.type) || isVideoType(f.type),
  );
  const newDocFiles = newFiles.filter(
    (f) => !isImageType(f.type) && !isVideoType(f.type),
  );

  const t = useTranslations();

  const processFiles = (files: File[]): ComposerAttachedFile[] =>
    files.map((f) => {
      const type = getFileType(f);
      const canPreview = isImageType(type) || isVideoType(type);
      return {
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        name: f.name,
        size: composerFormatFileSize(f.size),
        type,
        previewUrl: canPreview ? URL.createObjectURL(f) : undefined,
      };
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files ?? []).filter((f) => {
      const type = getFileType(f);
      return !isImageType(type) && !isVideoType(type);
    });
    for (const f of files) {
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB > MAX_DOC_MB) {
        setUploadError(
          t("post.edit.fileTooLarge", { name: f.name, limit: MAX_DOC_MB }),
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }
    setNewFiles((prev) => [...prev, ...processFiles(files)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files ?? []).filter((f) => {
      const type = getFileType(f);
      return isImageType(type) || isVideoType(type);
    });
    for (const f of files) {
      const type = getFileType(f);
      const sizeMB = f.size / (1024 * 1024);
      if (isImageType(type) && sizeMB > MAX_IMG_MB) {
        setUploadError(
          t("post.edit.fileTooLarge", { name: f.name, limit: MAX_IMG_MB }),
        );
        if (imageVideoInputRef.current) imageVideoInputRef.current.value = "";
        return;
      }
      if (isVideoType(type) && sizeMB > MAX_VID_MB) {
        setUploadError(
          t("post.edit.fileTooLarge", { name: f.name, limit: MAX_VID_MB }),
        );
        if (imageVideoInputRef.current) imageVideoInputRef.current.value = "";
        return;
      }
    }
    setNewFiles((prev) => [...prev, ...processFiles(files)]);
    if (imageVideoInputRef.current) imageVideoInputRef.current.value = "";
  };

  const removeNewFile = (id: string) => {
    setLightboxIndex(null);
    setNewFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const removeExistingMedia = (id: string) => {
    setExistingMedia((prev) => prev.filter((m) => m.id !== id));
    if (!id.startsWith("existing-")) {
      setRemovedDocIds((prev) => [...prev, id]);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setUploadError(null);
    try {
      let uploadedMedia: any[] = [];
      let uploadedDocs: any[] = [];

      if (newMediaFiles.length > 0) {
        const results = await startMediaUpload(
          newMediaFiles.map((f) => f.file),
        );
        uploadedMedia = (results ?? []).map((r, i) => ({
          url: r.ufsUrl ?? r.url,
          key: r.key,
          name: newMediaFiles[i].name,
          type: newMediaFiles[i].type,
          size: newMediaFiles[i].file.size,
        }));
      }

      if (newDocFiles.length > 0) {
        try {
          const results = await startDocUpload(newDocFiles.map((f) => f.file));
          if (!results || results.length === 0) {
            throw new Error(
              "Upload tài liệu thất bại — UploadThing trả về rỗng",
            );
          }
          uploadedDocs = results.map((r, i) => ({
            url: r.ufsUrl ?? r.url,
            key: r.key,
            name: newDocFiles[i].name,
            type: newDocFiles[i].type,
            size: newDocFiles[i].file.size,
          }));
        } catch (uploadErr) {
          setUploadError(t("post.edit.uploadDocFailed"));
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          visibility,
          removedDocIds,
          uploadedMedia,
          uploadedDocs,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("PATCH error body:", errText);
        throw new Error("Lưu thất bại");
      }
      const updatedPost = await res.json();
      onSave({ content: updatedPost.content, updatedPost });
    } catch (err) {
      console.error("handleSave error:", err);
      setUploadError(t("post.edit.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const allMediaForLightbox: ComposerAttachedFile[] = [
    ...existingMedia.map((m) => ({
      id: m.id,
      file: new File([], m.name),
      name: m.name,
      size: "",
      type: m.type,
      previewUrl: m.url,
    })),
    ...newMediaFiles,
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/35 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-text-primary">
              {t("post.edit.title")}
            </h2>
            <EditVisibilityPicker value={visibility} onChange={setVisibility} />
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center text-text-secondary hover:bg-surface-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <div className="px-5 pt-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              placeholder={t("post.edit.placeholder")}
              className="w-full resize-none text-sm text-text-primary placeholder:text-text-muted outline-none leading-relaxed min-h-[100px] max-h-[300px] bg-transparent"
              rows={4}
            />
            {content.length > charLimit * 0.8 && (
              <p
                className={`text-xs text-right mb-1 ${isOverLimit ? "text-red-500 dark:text-red-400 font-semibold" : "text-text-muted"}`}
              >
                {content.length}/{charLimit}
              </p>
            )}
          </div>

          {/* Existing + new media */}
          {(existingMedia.length > 0 || newMediaFiles.length > 0) && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {existingMedia.map((m, idx) => (
                <div
                  key={m.id}
                  className="relative group rounded-xl overflow-hidden border border-surface-200 bg-surface-50 shrink-0 cursor-pointer"
                  style={{ width: 96, height: 96 }}
                  onClick={() => setLightboxIndex(idx)}
                >
                  {m.type === "VIDEO" ? (
                    <video
                      src={m.url}
                      muted
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={m.url}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeExistingMedia(m.id);
                    }}
                    className="absolute top-1 right-1 bg-black/60 dark:bg-black/45 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X size={11} />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/50 dark:bg-black/35 text-white text-[10px] px-1 rounded pointer-events-none">
                    {t("post.edit.existing")}
                  </span>
                </div>
              ))}
              {newMediaFiles.map((f, idx) => (
                <MediaPreview
                  key={f.id}
                  attached={f}
                  onRemove={() => removeNewFile(f.id)}
                  onClick={() => setLightboxIndex(existingMedia.length + idx)}
                />
              ))}
            </div>
          )}

          {/* Existing + new attachments */}
          {(existingAttachments.length > 0 || newDocFiles.length > 0) && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {existingAttachments.map((att) => (
                <div
                  key={att.docId ?? att.name}
                  className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 text-sm"
                >
                  <FileText size={16} className="text-red-400 shrink-0" />
                  <span className="flex-1 truncate text-text-primary font-medium text-xs max-w-[160px]">
                    {att.name}
                  </span>
                  <span className="text-text-muted text-xs shrink-0">
                    {att.size}
                  </span>
                  <button
                    onClick={() => {
                      if (att.docId)
                        setRemovedDocIds((prev) => [...prev, att.docId!]);
                      setExistingAttachments((prev) =>
                        prev.filter((a) => a.docId !== att.docId),
                      );
                    }}
                    className="text-text-muted hover:text-text-secondary transition-colors ml-1"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {newDocFiles.map((f) => (
                <FileChip
                  key={f.id}
                  attached={f}
                  onRemove={() => removeNewFile(f.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-100 shrink-0">
          {uploadError && (
            <p className="text-xs text-red-500 dark:text-red-400 px-5 pt-3">
              {uploadError}
            </p>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
              />
              <input
                ref={imageVideoInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleImageVideoChange}
                accept="image/*,video/*"
              />
              <ActionButton
                icon={<Paperclip size={18} />}
                label={t("post.edit.attach")}
                onClick={() => fileInputRef.current?.click()}
              />
              <ActionButton
                icon={<ImageIcon size={18} />}
                label={t("post.edit.image")}
                onClick={() => {
                  if (imageVideoInputRef.current) {
                    imageVideoInputRef.current.accept = "image/*";
                    imageVideoInputRef.current.click();
                    setTimeout(() => {
                      if (imageVideoInputRef.current)
                        imageVideoInputRef.current.accept = "image/*,video/*";
                    }, 500);
                  }
                }}
              />
              <ActionButton
                icon={<Video size={18} />}
                label={t("post.edit.video")}
                onClick={() => {
                  if (imageVideoInputRef.current) {
                    imageVideoInputRef.current.accept = "video/*";
                    imageVideoInputRef.current.click();
                    setTimeout(() => {
                      if (imageVideoInputRef.current)
                        imageVideoInputRef.current.accept = "image/*,video/*";
                    }, 500);
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-text-secondary border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />{" "}
                    {t("common.saving")}
                  </>
                ) : (
                  <>{t("common.save")}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && allMediaForLightbox.length > 0 && (
        <MediaLightboxPreview
          files={allMediaForLightbox}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
