"use client";

import { useState, useRef } from "react";
import { clsx } from "clsx";
import {
  Paperclip,
  Smile,
  Send,
  Loader2,
  FileText,
  Eye,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useUploadThing } from "@/lib/uploadthing";
import Avatar from "@/components/ui/Avatar";
import {
  fileTypeColors,
  getFileExt,
  isImageFile,
  isVideoFile,
  formatFileSize,
} from "@/lib/feed/utils";
import type { AttachedFile, CommentPayload } from "@/lib/feed/types";

const MAX_VIDEO_MB = 64;
const MAX_IMAGE_MB = 8;
const MAX_DOC_MB = 16;

export function CommentFileBadge({
  name,
  size,
  type,
  url,
}: {
  name: string;
  size?: string;
  type?: string;
  url?: string;
}) {
  const ext = type ?? getFileExt(name);
  return (
    <div className="flex items-center gap-2 mt-2 p-2 bg-surface-50 rounded-lg border border-surface-200 max-w-[260px]">
      <div
        className={clsx(
          "w-8 h-8 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0",
          fileTypeColors[ext] ?? "bg-gray-500",
        )}
      >
        {ext.slice(0, 4)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-primary truncate">{name}</p>
        {size && <p className="text-[11px] text-text-secondary">{size}</p>}
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-surface-200 text-text-secondary transition-colors shrink-0"
          title="Xem trước"
          onClick={(e) => e.stopPropagation()}
        >
          <Eye size={14} />
        </a>
      ) : (
        <div
          className="p-1.5 text-text-secondary shrink-0"
          title="Không có URL tải"
        >
          <FileText size={14} />
        </div>
      )}
    </div>
  );
}

export function CommentMediaThumb({
  url,
  type = "video",
  fileName,
}: {
  url: string;
  type?: "image" | "video";
  fileName?: string;
}) {
  const [open, setOpen] = useState(false);
  const isVideo = type === "video";
  return (
    <>
      <div
        className="mt-2 rounded-xl overflow-hidden bg-black relative cursor-pointer group max-h-52"
        onClick={() => setOpen(true)}
      >
        {isVideo ? (
          <video
            src={url}
            muted
            preload="metadata"
            className="w-full max-h-52 object-cover group-hover:brightness-75 transition"
          />
        ) : (
          <img
            src={url}
            alt={fileName ?? "ảnh"}
            className="w-full max-h-52 object-cover group-hover:brightness-90 transition"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center shadow-lg">
            {isVideo ? (
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                className="w-5 h-5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <path d="M11 8v6M8 11h6" />
              </svg>
            )}
          </div>
        </div>
        {fileName && (
          <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
            <p className="text-white text-[11px] truncate bg-black/50 px-2 py-0.5 rounded">
              {fileName}
            </p>
          </div>
        )}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"
          >
            <X size={16} />
          </button>
          {isVideo ? (
            <video
              src={url}
              controls
              autoPlay
              className="max-w-[90vw] max-h-[85vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={url}
              alt={fileName ?? "ảnh"}
              className="max-w-[90vw] max-h-[85vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}

export default function CommentInput({
  onSubmit,
  disabled = false,
}: {
  onSubmit: (payload: CommentPayload) => Promise<void>;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<AttachedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | undefined>(undefined);
  const { data: session } = useSession();
  const { startUpload: uploadMedia } = useUploadThing("commentMedia");
  const { startUpload: uploadDoc } = useUploadThing("commentDocument");

  const initials = (session?.user?.name ?? "U")
    .split(" ")
    .map((w: string) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
  const userName = session?.user?.name ?? "U";
  const userImage = session?.user?.image ?? null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = getFileExt(file.name);
    const isImg = isImageFile(file.name);
    const isVid = isVideoFile(file.name);
    const sizeMB = file.size / (1024 * 1024);
    setUploadError(null);
    if (isImg && sizeMB > MAX_IMAGE_MB) {
      setUploadError(`Ảnh tối đa ${MAX_IMAGE_MB}MB`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (isVid && sizeMB > MAX_VIDEO_MB) {
      setUploadError(`Video tối đa ${MAX_VIDEO_MB}MB`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (!isImg && !isVid && sizeMB > MAX_DOC_MB) {
      setUploadError(`Tài liệu tối đa ${MAX_DOC_MB}MB`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const size = formatFileSize(file.size);
    pendingFileRef.current = file;
    if (isImg || isVid) {
      const previewUrl = URL.createObjectURL(file);
      setAttachment({
        name: file.name,
        size,
        type: ext,
        previewUrl,
        isImage: isImg,
        isVideo: isVid,
      });
    } else {
      setAttachment({
        name: file.name,
        size,
        type: ext,
        isImage: false,
        isVideo: false,
      });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!text.trim() && !attachment) return;
    setUploading(true);
    setUploadError(null);
    try {
      const rawFile = pendingFileRef.current;
      let imageUrl: string | undefined,
        videoUrl: string | undefined,
        fileUrl: string | undefined;
      if (rawFile && attachment) {
        if (attachment.isImage) {
          const r = await uploadMedia([rawFile]);
          imageUrl = r?.[0]?.ufsUrl ?? r?.[0]?.url;
        } else if (attachment.isVideo) {
          const r = await uploadMedia([rawFile]);
          videoUrl = r?.[0]?.ufsUrl ?? r?.[0]?.url;
        } else {
          const r = await uploadDoc([rawFile]);
          fileUrl = r?.[0]?.ufsUrl ?? r?.[0]?.url;
        }
        pendingFileRef.current = undefined;
      }
      await onSubmit({
        content: text.trim(),
        imageUrl,
        videoUrl,
        fileUrl,
        fileName: attachment?.name,
        fileSize: attachment?.size,
        fileType: attachment?.type,
      });
      if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      setText("");
      setAttachment(null);
    } catch (err: any) {
      setUploadError(err.message ?? "Tải lên thất bại, thử lại nhé");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
    pendingFileRef.current = undefined;
    setUploadError(null);
  };

  const canSubmit = (!!text.trim() || !!attachment) && !uploading && !disabled;

  return (
    <div className="flex gap-2.5">
      <Avatar
        src={userImage}
        name={userName}
        initials={initials}
        color="bg-primary"
        size="sm"
      />
      <div className="flex-1 min-w-0">
        {attachment && (
          <div className="relative mb-2 inline-block max-w-full">
            {attachment.isImage && attachment.previewUrl ? (
              <img
                src={attachment.previewUrl}
                alt="preview"
                className="h-20 rounded-xl object-cover border border-surface-200"
              />
            ) : attachment.isVideo && attachment.previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-surface-200 bg-black h-20 w-32">
                <video
                  src={attachment.previewUrl}
                  muted
                  preload="metadata"
                  className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-3.5 h-3.5 ml-0.5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-100 rounded-xl border border-surface-200">
                <FileText size={16} className="text-text-secondary shrink-0" />
                <span className="text-xs text-text-primary max-w-[160px] truncate">
                  {attachment.name}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {attachment.size}
                </span>
              </div>
            )}
            <button
              onClick={removeAttachment}
              className="absolute -top-1.5 -right-1.5 bg-text-primary text-white rounded-full p-0.5"
            >
              <X size={11} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 bg-surface-50 border border-surface-200 rounded-2xl px-3 py-2 focus-within:border-primary focus-within:bg-surface transition-all">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Viết bình luận..."
            rows={1}
            className="flex-1 resize-none text-sm text-text-primary placeholder:text-text-secondary outline-none bg-transparent leading-relaxed max-h-28 disabled:opacity-60"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
          />
          <div className="flex items-center gap-1 shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || disabled}
              className="p-1 text-text-secondary hover:text-primary transition-colors disabled:opacity-40"
              title="Đính kèm tệp"
            >
              <Paperclip size={16} />
            </button>
            <button
              className="p-1 text-text-secondary hover:text-amber-500 transition-colors"
              title="Emoji"
            >
              <Smile size={16} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={clsx(
                "p-1.5 rounded-full transition-all",
                canSubmit
                  ? "text-white bg-primary hover:bg-primary-600 shadow-sm"
                  : "text-text-secondary cursor-not-allowed",
              )}
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
            </button>
          </div>
        </div>
        {uploading && (
          <p className="text-[11px] text-text-secondary mt-1 ml-1">
            Đang tải lên...
          </p>
        )}
        {uploadError && (
          <p className="text-[11px] text-red-500 mt-1 ml-1">{uploadError}</p>
        )}
      </div>
    </div>
  );
}
