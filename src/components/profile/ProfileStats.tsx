"use client";
import { useTranslations } from "next-intl";

interface StatsShape {
  followers: string | number;
  following: string | number;
  documents: string | number;
  downloads: string | number;
}

interface ProfileStatsProps {
  stats: StatsShape;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const t = useTranslations("search");

  const LABELS = [
    { key: "followers" as const, label: t("followersLabel") },
    { key: "documents" as const, label: t("documentsCountLabel") },
    { key: "downloads" as const, label: t("downloadsLabel") },
  ];

  return (
    <div className="flex items-center gap-5 px-1 mb-5 border-b border-surface-100 pb-4">
      {LABELS.map(({ key, label }) => (
        <button
          key={key}
          className="flex items-baseline gap-1 hover:opacity-70 transition-opacity"
        >
          <span className="text-sm font-bold text-text-primary tabular-nums">
            {stats[key]}
          </span>
          <span className="text-xs text-text-muted">{label}</span>
        </button>
      ))}
    </div>
  );
}