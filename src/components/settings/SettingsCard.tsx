"use client";
import { ReactNode } from "react";

export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-surface border border-surface-200 rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        {description && (
          <p className="text-xs text-text-muted mt-1">{description}</p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}