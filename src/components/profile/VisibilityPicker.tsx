"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Globe, Users, Lock, ChevronDown } from "lucide-react";

export type Visibility = "public" | "friends" | "private";

interface VisibilityPickerProps {
  value: Visibility;
  onChange: (v: Visibility) => void;
}

export function VisibilityPicker({ value, onChange }: VisibilityPickerProps) {
  const t = useTranslations("post.composer.visibility");
  const [open, setOpen] = useState(false);

  const VISIBILITY_OPTIONS: {
    value: Visibility;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "public", label: t("public"), icon: <Globe size={14} /> },
    { value: "friends", label: t("friends"), icon: <Users size={14} /> },
    { value: "private", label: t("private"), icon: <Lock size={14} /> },
  ];

  const current = VISIBILITY_OPTIONS.find((o) => o.value === value)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 px-2.5 py-1.5 rounded-full transition-colors"
      >
        {current.icon}
        {current.label}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 bg-surface border border-surface-200 rounded-xl shadow-lg z-20 min-w-[160px] overflow-hidden">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-50 transition-colors ${
                opt.value === value
                  ? "text-primary font-semibold"
                  : "text-text-primary"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}