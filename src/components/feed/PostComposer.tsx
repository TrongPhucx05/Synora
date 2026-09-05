"use client";

import { useState, useRef } from "react";
import {
  ImageIcon,
  FileText,
  X,
  Paperclip,
  ChevronDown,
  Users,
  Globe,
  Lock,
  Video,
  Play,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import NextLink from "next/link";
import Avatar from "@/components/ui/Avatar";

export interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
}

interface PostComposerProps {
  onPost?: (post: {
    content: string;
    tags: string[];
    files: AttachedFile[];
    uploadedMedia: {
      url: string;
      key: string;
      name: string;
      type: string;
      size: number;
    }[];
    uploadedDocs: {
      url: string;
      key: string;
      name: string;
      type: string;
      size: number;
    }[];
    visibility: string;
  }) => void;
  currentUser?: { name: string; initials: string; image?: string | null };
}

type Visibility = "public" | "friends" | "private";

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "public", label: "Mọi người", icon: <Globe size={14} /> },
  { value: "friends", label: "Bạn bè", icon: <Users size={14} /> },
  { value: "private", label: "Chỉ mình tôi", icon: <Lock size={14} /> },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(file: File): string {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
  return ext;
}

const IMAGE_TYPES = ["JPG", "JPEG", "PNG", "GIF", "WEBP"];
const VIDEO_TYPES = ["MP4", "MOV", "AVI", "WEBM", "MKV"];

function isImageType(type: string) {
  return IMAGE_TYPES.includes(type);
}

function isVideoType(type: string) {
  return VIDEO_TYPES.includes(type);
}

function getFileIcon(type: string) {
  if (isImageType(type))
    return <ImageIcon size={16} className="text-blue-400" />;
  if (isVideoType(type)) return <Video size={16} className="text-purple-400" />;
  if (["PDF"].includes(type))
    return <FileText size={16} className="text-red-400" />;
  return <Paperclip size={16} className="text-text-muted" />;
}

function VisibilityPicker({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = VISIBILITY_OPTIONS.find((o) => o.value === value)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 px-2.5 py-1.5 rounded-full transition-colors"
      >
        {current.icon}
        {current.label}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 bg-surface border border-surface-200 rounded-xl shadow-lg z-20 min-w-[160px] overflow-hidden">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-50 transition-colors ${
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

function FileChip({
  attached,
  onRemove,
}: {
  attached: AttachedFile;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 text-sm">
      {getFileIcon(attached.type)}
      <span className="flex-1 truncate text-text-primary font-medium text-xs max-w-[160px]">
        {attached.name}
      </span>
      <span className="text-text-muted text-xs shrink-0">{attached.size}</span>
      <button
        onClick={onRemove}
        className="text-text-muted hover:text-text-secondary transition-colors ml-1"
        aria-label="Xóa file"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function MediaLightboxPreview({
  files,
  initialIndex,
  onClose,
}: {
  files: AttachedFile[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const current = files[index];
  const isVideo = isVideoType(current.type);

  const prev = () => setIndex((i) => (i > 0 ? i - 1 : files.length - 1));
  const next = () => setIndex((i) => (i < files.length - 1 ? i + 1 : 0));

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 dark:bg-black/70 flex flex-col items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKey}
      tabIndex={-1}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"
        aria-label="Đóng"
      >
        <X size={18} />
      </button>

      {files.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 dark:bg-black/35 text-white text-xs px-3 py-1 rounded-full">
          {index + 1} / {files.length}
        </div>
      )}

      {files.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <div
        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={current.previewUrl}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl"
            style={{ objectFit: "contain" }}
          />
        ) : (
          <img
            src={current.previewUrl}
            alt={current.name}
            className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl"
            style={{ objectFit: "contain" }}
          />
        )}
      </div>

      {files.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"
        >
          <ChevronRight size={22} />
        </button>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 dark:bg-black/35 text-white text-xs px-3 py-1 rounded-full max-w-xs truncate">
        {current.name} · {current.size}
      </div>

      {files.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
          {files.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === index ? "bg-surface scale-125" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaPreview({
  attached,
  onRemove,
  onClick,
}: {
  attached: AttachedFile;
  onRemove: () => void;
  onClick: () => void;
}) {
  const isVideo = isVideoType(attached.type);

  return (
    <div
      className="relative group rounded-xl overflow-hidden border border-surface-200 bg-surface-50 shrink-0 cursor-pointer"
      style={{ width: 96, height: 96 }}
      onClick={onClick}
    >
      {isVideo ? (
        <>
          <video
            src={attached.previewUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 dark:bg-black/25 transition-colors">
            <div className="w-9 h-9 rounded-full bg-black/50 dark:bg-black/35 flex items-center justify-center">
              <Play size={16} className="text-white ml-0.5" />
            </div>
          </div>
        </>
      ) : (
        <>
          <img
            src={attached.previewUrl}
            alt={attached.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn
              size={16}
              className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 bg-black/60 dark:bg-black/45 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Xóa"
      >
        <X size={11} />
      </button>

      <span className="absolute bottom-1 left-1 bg-black/50 dark:bg-black/35 text-white text-[10px] px-1 rounded pointer-events-none">
        {attached.size}
      </span>
    </div>
  );
}

export default function PostComposer({
  onPost,
  currentUser,
}: PostComposerProps) {
  const name = currentUser?.name ?? "Người dùng";
  const initials = currentUser?.initials ?? "U";
  const [content, setContent] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { startUpload: startMediaUpload } = useUploadThing("postMedia");
  const { startUpload: startDocUpload } = useUploadThing("postDocument");

  const tags = Array.from(
    new Set((content.match(/#[\wÀ-ỹ]+/gu) ?? []).map((t) => t.toLowerCase())),
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageVideoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charLimit = 1000;
  const charCount = content.length;
  const isOverLimit = charCount > charLimit;
  const canPost = content.trim().length > 0 && !isOverLimit && !isSubmitting;

  const mediaFiles = attachedFiles.filter(
    (f) => isImageType(f.type) || isVideoType(f.type),
  );
  const otherFiles = attachedFiles.filter(
    (f) => !isImageType(f.type) && !isVideoType(f.type),
  );

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const processFiles = (files: File[]): AttachedFile[] =>
    files.map((f) => {
      const type = getFileType(f);
      const canPreview = isImageType(type) || isVideoType(type);
      return {
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        name: f.name,
        size: formatFileSize(f.size),
        type,
        previewUrl: canPreview ? URL.createObjectURL(f) : undefined,
      };
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => {
      const type = getFileType(f);
      return !isImageType(type) && !isVideoType(type);
    });
    setAttachedFiles((prev) => [...prev, ...processFiles(files)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => {
      const type = getFileType(f);
      return isImageType(type) || isVideoType(type);
    });
    setAttachedFiles((prev) => [...prev, ...processFiles(files)]);
    if (imageVideoInputRef.current) imageVideoInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setLightboxIndex(null);
    setAttachedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!canPost) return;
    setIsSubmitting(true);

    let uploadedMedia: {
      url: string;
      key: string;
      name: string;
      type: string;
      size: number;
    }[] = [];
    let uploadedDocs: {
      url: string;
      key: string;
      name: string;
      type: string;
      size: number;
    }[] = [];

    if (mediaFiles.length > 0) {
      const results = await startMediaUpload(mediaFiles.map((f) => f.file));
      uploadedMedia = (results ?? []).map((r, i) => ({
        url: r.ufsUrl ?? r.url,
        key: r.key,
        name: mediaFiles[i].name,
        type: mediaFiles[i].type,
        size: mediaFiles[i].file.size,
      }));
    }

    if (otherFiles.length > 0) {
      const results = await startDocUpload(otherFiles.map((f) => f.file));
      uploadedDocs = (results ?? []).map((r, i) => ({
        url: r.ufsUrl ?? r.url,
        key: r.key,
        name: otherFiles[i].name,
        type: otherFiles[i].type,
        size: otherFiles[i].file.size,
      }));
    }

    onPost?.({
      content,
      tags,
      files: attachedFiles,
      uploadedMedia,
      uploadedDocs,
      visibility,
    });

    setContent("");
    setAttachedFiles([]);
    setIsSubmitting(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <>
      <div className="bg-surface rounded-2xl border border-surface-200 shadow-sm overflow-visible">
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          <NextLink
            href={
              currentUser?.username ? `/profile/${currentUser.username}` : "#"
            }
          >
            <Avatar
              src={currentUser?.image}
              name={name}
              initials={initials}
              size="md"
            />
          </NextLink>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-text-primary">
              {name}
            </span>
            <VisibilityPicker value={visibility} onChange={setVisibility} />
          </div>
        </div>

        <div className="px-5">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            placeholder="Bạn đang nghĩ gì? Chia sẻ tài liệu, hỏi bài, hay rủ học nhóm..."
            className="w-full resize-none text-sm text-text-primary placeholder:text-text-muted outline-none leading-relaxed min-h-[80px] max-h-[320px] bg-transparent"
            rows={3}
          />

          {charCount > charLimit * 0.8 && (
            <div
              className={`text-xs text-right mb-1 ${
                isOverLimit ? "text-red-500 dark:text-red-400 font-semibold" : "text-text-muted"
              }`}
            >
              {charCount}/{charLimit}
            </div>
          )}
        </div>

        {mediaFiles.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {mediaFiles.map((f, idx) => (
              <MediaPreview
                key={f.id}
                attached={f}
                onRemove={() => removeFile(f.id)}
                onClick={() => setLightboxIndex(idx)}
              />
            ))}
          </div>
        )}

        {otherFiles.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {otherFiles.map((f) => (
              <FileChip
                key={f.id}
                attached={f}
                onRemove={() => removeFile(f.id)}
              />
            ))}
          </div>
        )}

        <div className="mx-5 border-t border-surface-100" />

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
              label="Đính kèm file"
              onClick={() => fileInputRef.current?.click()}
            />
            <ActionButton
              icon={<ImageIcon size={18} />}
              label="Thêm ảnh"
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
              label="Thêm video"
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

          <button
            onClick={handleSubmit}
            disabled={!canPost}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              canPost
                ? "bg-primary hover:bg-primary-600 text-white shadow-sm hover:shadow-md active:scale-95"
                : "bg-surface-100 text-text-muted cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang đăng...
              </>
            ) : (
              <>Đăng bài</>
            )}
          </button>
        </div>
      </div>

      {lightboxIndex !== null && mediaFiles.length > 0 && (
        <MediaLightboxPreview
          files={mediaFiles}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 ${
        active
          ? "bg-primary-50 text-primary"
          : "text-text-secondary hover:bg-surface-100 hover:text-text-primary"
      }`}
    >
      {icon}
      <span className="hidden sm:inline text-xs font-medium">{label}</span>
    </button>
  );
}

export {
  isImageType,
  isVideoType,
  formatFileSize,
  getFileType,
  MediaPreview,
  FileChip,
  MediaLightboxPreview,
  ActionButton,
};
