"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Users } from "lucide-react";
import NextLink from "next/link";

interface Community {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  memberCount: number;
  isAdmin: boolean;
}

interface SuggestionsWidgetProps {
  username: string;
}

const COLORS = [
  "bg-violet-500", "bg-emerald-500", "bg-blue-500",
  "bg-amber-500", "bg-rose-500",
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function SuggestionsWidget({ username }: SuggestionsWidgetProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${username}/communities`)
      .then((r) => r.json())
      .then((data) => {
        setCommunities(data.communities ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="bg-surface border border-surface-200 rounded-2xl p-4">
        <div className="h-4 w-28 bg-surface-100 rounded animate-pulse mb-3" />
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-surface-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-surface-100 rounded animate-pulse w-3/4" />
              <div className="h-2.5 bg-surface-100 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (communities.length === 0) return null;

  return (
    <div className="bg-surface border border-surface-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-semibold text-text-primary">Nhóm của bạn</h3>
        <NextLink
          href="/community"
          className="text-[11px] text-primary font-medium hover:text-primary-700 transition-colors"
        >
          Tất cả
        </NextLink>
      </div>
      <div className="flex flex-col gap-2.5">
        {communities.map((c, i) => (
          <NextLink
            key={c.id}
            href={`/community/${c.slug}`}
            className="flex items-center gap-2 group"
          >
            {c.avatarUrl ? (
              <img
                src={c.avatarUrl}
                alt={c.name}
                className="w-7 h-7 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div
                className={clsx(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0",
                  COLORS[i % COLORS.length]
                )}
              >
                {initials(c.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                {c.name}
              </p>
              <p className="text-[10px] text-text-muted flex items-center gap-1">
                <Users size={9} />
                {c.memberCount.toLocaleString("vi-VN")} thành viên
                {c.isAdmin && (
                  <span className="text-primary font-semibold ml-1">· Admin</span>
                )}
              </p>
            </div>
          </NextLink>
        ))}
      </div>
    </div>
  );
}