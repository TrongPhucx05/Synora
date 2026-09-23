"use client";
import { useTranslations } from "next-intl";

interface SubjectsWidgetProps {
  subjects?: string[];
}

export function SubjectsWidget({ subjects }: SubjectsWidgetProps) {
  const t = useTranslations("profile.subjectsWidget");
  if (!subjects || subjects.length === 0) return null;

  return (
    <div className="bg-surface border border-surface-200 rounded-2xl p-4">
      <h3 className="text-xs font-semibold text-text-primary mb-2.5">{t("title")}</h3>
      <div className="flex flex-wrap gap-1.5">
        {subjects.map((s) => (
          <span
            key={s}
            className="text-[11px] font-medium bg-surface-50 text-text-secondary px-2.5 py-1 rounded-full border border-surface-200 hover:border-primary/30 hover:text-primary hover:bg-primary/5 cursor-pointer transition-colors"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}