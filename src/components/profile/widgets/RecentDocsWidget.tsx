import { BookOpen, ExternalLink } from "lucide-react";
import NextLink from "next/link";

interface Doc {
  id: string;
  title: string;
  pageCount?: number | null;
  downloadCount: number;
  fileUrl?: string;
}

interface RecentDocsWidgetProps {
  docs?: Doc[];
  username?: string;
}

export function RecentDocsWidget({ docs = [], username }: RecentDocsWidgetProps) {
  if (docs.length === 0) return null;

  return (
    <div className="bg-surface border border-surface-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-semibold text-text-primary">
          Tài liệu gần đây
        </h3>
        <NextLink
          href={`/profile/${username}/documents`}
          className="text-[11px] text-primary font-medium hover:text-primary-700 transition-colors"
        >
          Tất cả
        </NextLink>
      </div>
      <div className="flex flex-col gap-0.5">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-surface-50 group transition-colors"
          >
            <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen size={12} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                {doc.title}
              </p>
              <p className="text-[10px] text-text-muted">
                {doc.pageCount ? `${doc.pageCount} trang · ` : ""}
                {doc.downloadCount} lượt tải
              </p>
            </div>
            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-primary border border-primary/25 px-2 py-0.5 rounded-full hover:bg-primary/5 transition-colors opacity-0 group-hover:opacity-100"
                title="Xem tài liệu"
              >
                <ExternalLink size={9} />
                Xem
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
