import Link from "next/link";
import { MessageSquare, ThumbsUp } from "lucide-react";
import type { SearchResult } from "@/lib/search/types";

export function PostCard({ r }: { r: SearchResult }) {
  return (
    <Link
      href={r.href}
      className="group block p-4 rounded-xl hover:bg-surface-50 border border-transparent hover:border-surface-200 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-2 flex-1">
          {r.title}
        </h3>
        {r.badge && (
          <span className="shrink-0 text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
            {r.badge}
          </span>
        )}
      </div>
      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{r.subtitle}</p>
      <p className="text-[11px] text-text-muted mt-1.5">{r.meta}</p>
      {r.tags && (
        <div className="flex gap-1 mt-2">
          {r.tags.map((t) => (
            <span key={t} className="text-[10px] bg-surface-100 text-text-secondary px-2 py-0.5 rounded-full">
              {t}
            </span>
          ))}
        </div>
      )}
      {r.stats && (
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <MessageSquare size={11} /> {r.stats[0].value} {r.stats[0].label}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <ThumbsUp size={11} /> {r.stats[1].value} {r.stats[1].label}
          </span>
        </div>
      )}
    </Link>
  );
}