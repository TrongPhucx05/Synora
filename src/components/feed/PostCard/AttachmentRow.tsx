"use client";

import { Eye, Download } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import {
  fileTypeColors,
  MEDIA_IMAGE_TYPES,
  MEDIA_VIDEO_TYPES,
} from "@/lib/feed/utils";
import type { Attachment } from "@/lib/feed/types";

export default function AttachmentRow({
  attachment,
  className,
}: {
  attachment: Attachment;
  className?: string;
}) {
  const t = useTranslations("common");
  const isMedia =
    MEDIA_IMAGE_TYPES.has(attachment.type) ||
    MEDIA_VIDEO_TYPES.has(attachment.type);
  if (isMedia) return null;

  const handleDownload = async () => {
    if (!attachment.url) return;
    try {
      const res = await fetch(attachment.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(attachment.url, "_blank");
    }
  };

  const handlePreview = () => {
    if (!attachment.url) return;
    const encoded = encodeURIComponent(attachment.url);
    const type = attachment.type.toUpperCase();
    let viewerUrl: string;
    if (type === "PPTX" || type === "DOCX") {
      viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encoded}`;
    } else {
      viewerUrl = `https://docs.google.com/viewer?url=${encoded}`;
    }
    window.open(viewerUrl, "_blank");
  };

  return (
    <div
      className={clsx(
        "flex items-center justify-between p-3 bg-surface-50 rounded-lg border border-surface-200",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            "w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0",
            fileTypeColors[attachment.type] ?? "bg-gray-500",
          )}
        >
          {attachment.type}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {attachment.name}
          </p>
          <p className="text-xs text-text-secondary">{attachment.size}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handlePreview}
          disabled={!attachment.url}
          className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-40"
        >
          <Eye size={12} />
          {t("preview")}
        </button>
        <button
          onClick={handleDownload}
          disabled={!attachment.url}
          aria-label={t("download")}
          className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-40"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
}
