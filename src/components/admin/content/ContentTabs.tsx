"use client";
import { clsx } from "clsx";

export type ContentTabKey = "posts" | "comments" | "media";

const TABS: { key: ContentTabKey; label: string }[] = [
  { key: "posts", label: "Bài viết" },
  { key: "comments", label: "Bình luận" },
  { key: "media", label: "Media" },
];

export function ContentTabs({
  value,
  onChange,
  counts,
}: {
  value: ContentTabKey;
  onChange: (v: ContentTabKey) => void;
  counts: Record<ContentTabKey, number>;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-surface-200 mb-5">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            "relative px-4 py-2.5 text-sm font-medium transition-colors",
            value === tab.key
              ? "text-blue-600 dark:text-blue-400"
              : "text-text-muted hover:text-text-secondary",
          )}
        >
          {tab.label}
          <span
            className={clsx(
              "ml-1.5 text-[11px] rounded-full px-1.5 py-0.5",
              value === tab.key
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                : "bg-surface-100 text-text-muted",
            )}
          >
            {counts[tab.key]}
          </span>
          {value === tab.key && (
            <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}