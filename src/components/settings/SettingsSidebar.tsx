"use client";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { User, Shield, Bell, Palette } from "lucide-react";

export type SettingsTab = "account" | "privacy" | "notifications" | "appearance";

const TAB_META: { id: SettingsTab; icon: typeof User }[] = [
  { id: "account", icon: User },
  { id: "privacy", icon: Shield },
  { id: "notifications", icon: Bell },
  { id: "appearance", icon: Palette },
];

export function SettingsSidebar({
  active,
  onSelect,
}: {
  active: SettingsTab;
  onSelect: (tab: SettingsTab) => void;
}) {
  const t = useTranslations("settings.nav");

  return (
    <nav className="flex md:flex-col gap-1 overflow-x-auto scrollbar-hide md:overflow-visible">
      {TAB_META.map(({ id, icon: Icon }) => {
        const isActive = active === id;
        const label = t(`${id}.label`);
        const subItems = t.raw(`${id}.subItems`) as string[];
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={clsx(
              "flex items-center md:items-start gap-2 md:gap-3 px-3 md:px-3.5 py-2 md:py-3 rounded-xl text-left transition-colors shrink-0 md:shrink",
              isActive ? "bg-primary/10" : "hover:bg-surface-100",
            )}
          >
            <div
              className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 md:mt-0.5",
                isActive
                  ? "bg-primary text-white"
                  : "bg-surface-100 text-text-muted",
              )}
            >
              <Icon size={15} />
            </div>
            <div className="min-w-0">
              <p
                className={clsx(
                  "text-sm font-semibold whitespace-nowrap",
                  isActive ? "text-primary" : "text-text-primary",
                )}
              >
                {label}
              </p>
              <p className="hidden md:block text-[11px] text-text-muted mt-0.5 truncate">
                {subItems.join(" · ")}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}