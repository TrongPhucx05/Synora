"use client";
import { useTranslations } from "next-intl";

interface EmptyStateProps {
  query: string;
}

export default function EmptyState({ query }: EmptyStateProps) {
  const t = useTranslations("library.empty");
  return (
    <div className="flex flex-col items-center py-20 text-center col-span-3">
      <p className="text-sm font-semibold text-text-primary mb-1.5">
        {t("title")}
      </p>
      <p className="text-xs text-text-muted max-w-[260px] leading-relaxed">
        {query ? t("withQuery", { query }) : t("noQuery")}
      </p>
    </div>
  );
}