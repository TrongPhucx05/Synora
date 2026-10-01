"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

type NotifKey =
  | "communityLikes"
  | "communityComments"
  | "communityFollows"
  | "communityMentions"
  | "groupInvites"
  | "groupMessages"
  | "groupUpdates"
  | "docShares"
  | "docComments"
  | "docEdits";

const DEFAULTS: Record<NotifKey, boolean> = {
  communityLikes: true,
  communityComments: true,
  communityFollows: true,
  communityMentions: true,
  groupInvites: true,
  groupMessages: true,
  groupUpdates: false,
  docShares: true,
  docComments: true,
  docEdits: false,
};

export function NotificationSection() {
  const t = useTranslations("settings.notifications");
  const [settings, setSettings] = useState(DEFAULTS);
  const toggle = (key: NotifKey) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard title={t("community.title")} description={t("community.desc")}>
        <SettingsRow label={t("community.likes")}>
          <ToggleSwitch checked={settings.communityLikes} onChange={() => toggle("communityLikes")} />
        </SettingsRow>
        <SettingsRow label={t("community.comments")}>
          <ToggleSwitch checked={settings.communityComments} onChange={() => toggle("communityComments")} />
        </SettingsRow>
        <SettingsRow label={t("community.follows")}>
          <ToggleSwitch checked={settings.communityFollows} onChange={() => toggle("communityFollows")} />
        </SettingsRow>
        <SettingsRow label={t("community.mentions")}>
          <ToggleSwitch checked={settings.communityMentions} onChange={() => toggle("communityMentions")} />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title={t("group.title")} description={t("group.desc")}>
        <SettingsRow label={t("group.invites")}>
          <ToggleSwitch checked={settings.groupInvites} onChange={() => toggle("groupInvites")} />
        </SettingsRow>
        <SettingsRow label={t("group.messages")}>
          <ToggleSwitch checked={settings.groupMessages} onChange={() => toggle("groupMessages")} />
        </SettingsRow>
        <SettingsRow label={t("group.updates")} description={t("group.updatesDesc")}>
          <ToggleSwitch checked={settings.groupUpdates} onChange={() => toggle("groupUpdates")} />
        </SettingsRow>
      </SettingsCard>
    </div>
  );
}