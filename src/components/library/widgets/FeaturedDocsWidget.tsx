"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import clsx from "clsx";
import { FILE_TYPE_COLORS } from "@/lib/library/data";
import type { FeaturedDoc } from "@/lib/library/types";

interface FeaturedDocsWidgetProps {
  refreshKey?: number;
}

export default function FeaturedDocsWidget({
  refreshKey = 0,
}: FeaturedDocsWidgetProps) {
  const [docs, setDocs] = useState<FeaturedDoc[]>([]);

  useEffect(() => {
    fetch("/api/library/documents?sort=mostDownloaded", {
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
      .then((r) => r.json())
      .then((data) => {
        const mapped = (data.docs ?? [])
          .filter((d: any) => (d.downloadCount ?? 0) > 0)
          .slice(0, 3)
          .map((d: any) => ({
            id: d.id,
            title: d.title,
            type: d.mimeType?.includes("pdf")
              ? "PDF"
              : d.mimeType?.includes("presentation")
                ? "PPTX"
                : d.mimeType?.includes("wordprocessing")
                  ? "DOCX"
                  : "PDF",
            downloadCount: d.downloadCount,
          }));
        setDocs(mapped);
      });
  }, [refreshKey]);

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Tài liệu nổi bật
      </h3>
      <div className="flex flex-col gap-2">
        {docs.map((doc) => {
          const typeKey = doc.type?.toUpperCase() ?? "PDF";
          const color = FILE_TYPE_COLORS[typeKey] ?? "bg-gray-500";
          const dlCount =
            doc.downloadCount >= 1000
              ? `${(doc.downloadCount / 1000).toFixed(1)}k`
              : String(doc.downloadCount);
          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 py-1 cursor-pointer group"
            >
              <div
                className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0",
                  color,
                )}
              >
                {typeKey.slice(0, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                  {doc.title}
                </p>
                <p className="text-[10px] text-text-muted flex items-center gap-1">
                  <Download size={9} /> {dlCount} lượt tải
                </p>
              </div>
            </div>
          );
        })}
        {docs.length === 0 && (
          <p className="text-xs text-text-muted py-2">
            Chưa có tài liệu nào được tải xuống.
          </p>
        )}
      </div>
    </div>
  );
}
