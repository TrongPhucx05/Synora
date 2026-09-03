"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";

interface TrendingTag {
  name: string;
  _count: { posts: number };
}

interface Props {
  variant?: "feed" | "search";
}

export default function TrendingTopics({ variant = "feed" }: Props) {
  const [topics, setTopics] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetch("/api/tags/trending", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTopics(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [tick]);

  useEffect(() => {
    window.addEventListener("tags:changed", refetch);
    return () => window.removeEventListener("tags:changed", refetch);
  }, [refetch]);

  if (!loading && topics.length === 0) return null;

  return (
    <div
      className={`bg-surface rounded-xl border border-surface-200 p-4 ${
        variant === "feed" ? "shadow-card" : ""
      }`}
    >
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Chủ đề thịnh hành
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin text-text-muted" />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {topics.map((t, i) => (
            <Link
              key={t.name}
              href={`/search?q=${encodeURIComponent("#" + t.name)}&tab=topics`}
              className="flex items-center gap-3 py-1.5 px-1 rounded-lg hover:bg-surface-50 group transition-colors"
            >
              <span className="text-xs font-bold text-text-muted w-4 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                  #{t.name}
                </p>
                <p className="text-xs text-text-muted">
                  {t._count.posts} bài viết
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/search?tab=topics"
        className="block mt-3 text-center text-xs text-primary font-medium py-2 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
      >
        Khám phá thêm
      </Link>
    </div>
  );
}
