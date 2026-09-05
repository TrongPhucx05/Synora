"use client";

import { useEffect, useState } from "react";
import { FileText, Users, Download } from "lucide-react";
import clsx from "clsx";
import type { LibraryStats } from "@/lib/library/types";

interface StatsWidgetProps {
  refreshKey?: number;
}

const ICONS = [
  {
    key: "totalDocuments",
    label: "tài liệu",
    icon: FileText,
    iconClass: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15",
  },
  {
    key: "totalContributors",
    label: "người đóng góp",
    icon: Users,
    iconClass: "text-primary bg-primary-50",
  },
  {
    key: "totalDownloads",
    label: "lượt tải",
    icon: Download,
    iconClass: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/15",
  },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function StatsWidget({ refreshKey = 0 }: StatsWidgetProps) {
  const [stats, setStats] = useState<LibraryStats | null>(null);

  useEffect(() => {
    fetch("/api/library/stats", {
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
      .then((r) => r.json())
      .then(setStats);
  }, [refreshKey]);

  return (
    <div className="bg-surface rounded-xl border border-surface-200 shadow-card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Thống kê thư viện
      </h3>
      <div className="flex flex-col gap-2.5">
        {ICONS.map(({ key, label, icon: Icon, iconClass }) => (
          <div key={key} className="flex items-center gap-3">
            <div
              className={clsx(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                iconClass,
              )}
            >
              <Icon size={13} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary leading-tight">
                {stats ? fmt((stats as any)[key]) : "—"}
              </p>
              <p className="text-[11px] text-text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
