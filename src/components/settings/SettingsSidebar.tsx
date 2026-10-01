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
    <nav className="flex flex-col gap-1">
      {TAB_META.map(({ id, icon: Icon }) => {
        const isActive = active === id;
        const label = t(`${id}.label`);
        const subItems = t.raw(`${id}.subItems`) as string[];
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={clsx(
              "flex items-start gap-3 px-3.5 py-3 rounded-xl text-left transition-colors",
              isActive ? "bg-primary/10" : "hover:bg-surface-100",
            )}
          >
            <div
              className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
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
                  "text-sm font-semibold",
                  isActive ? "text-primary" : "text-text-primary",
                )}
              >
                {label}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 truncate">
                {subItems.join(" · ")}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}