"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { EmptyPlaceholder } from "@/components/admin/EmptyPlaceholder";
import {
  ACTION_ICON,
  ACTION_LABELS,
  type AuditLogEntry,
} from "@/lib/audit-log/types";

const LIMIT = 5;

export function RecentActivity() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/audit-log?page=1")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.entries))
          setEntries(data.entries.slice(0, LIMIT));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-surface border border-surface-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text-primary">
          Hoạt động gần đây của admin
        </h3>
        <Link
          href="/admin/audit-log"
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Xem tất cả
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <div key={i} className="h-8 bg-surface-50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyPlaceholder
          icon={FileText}
          title="Chưa có hoạt động nào"
          description="Các thao tác quản trị gần đây sẽ hiển thị ở đây"
        />
      ) : (
        <div className="flex flex-col">
          {entries.map((e) => {
            const Icon = ACTION_ICON[e.action] ?? FileText;
            return (
              <div
                key={e.id}
                className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-b-0"
              >
                <Icon size={14} className="text-text-muted shrink-0" />
                <span className="text-xs font-semibold text-blue-600 shrink-0">
                  {e.actor.name}
                </span>
                <span className="text-xs text-text-secondary truncate flex-1">
                  {ACTION_LABELS[e.action] ?? e.action}
                  {e.targetLabel ? ` · ${e.targetLabel}` : ""}
                </span>
                <span className="text-[11px] font-mono text-text-muted shrink-0">
                  {e.createdAt}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
