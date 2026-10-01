"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingsSidebar, type SettingsTab } from "@/components/settings/SettingsSidebar";
import { AccountSection } from "@/components/settings/Account";
import { PrivacySection } from "@/components/settings/Privacy";
import { NotificationSection } from "@/components/settings/Notifications";
import { AppearanceSection } from "@/components/settings/Theme";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const TITLES: Record<SettingsTab, string> = {
    account: t("nav.account.label"),
    privacy: t("nav.privacy.label"),
    notifications: t("nav.notifications.label"),
    appearance: t("nav.appearance.label"),
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/feed"
            className="p-2 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold text-text-primary">{t("pageTitle")}</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <aside className="w-full md:w-72 shrink-0 bg-surface border border-surface-200 rounded-2xl p-3 md:sticky md:top-6">
            <SettingsSidebar active={activeTab} onSelect={setActiveTab} />
          </aside>

          <main className="flex-1 min-w-0 w-full">
            <h2 className="text-base font-bold text-text-primary mb-4">
              {TITLES[activeTab]}
            </h2>
            {activeTab === "account" && <AccountSection />}
            {activeTab === "privacy" && <PrivacySection />}
            {activeTab === "notifications" && <NotificationSection />}
            {activeTab === "appearance" && <AppearanceSection />}
          </main>
        </div>
      </div>
    </div>
  );
}