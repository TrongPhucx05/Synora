"use client";
import { useState } from "react";
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
  const [settings, setSettings] = useState(DEFAULTS);
  const toggle = (key: NotifKey) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard title="Cộng đồng" description="Thông báo liên quan đến bài viết, bình luận và người theo dõi">
        <SettingsRow label="Lượt thích bài viết">
          <ToggleSwitch checked={settings.communityLikes} onChange={() => toggle("communityLikes")} />
        </SettingsRow>
        <SettingsRow label="Bình luận mới">
          <ToggleSwitch checked={settings.communityComments} onChange={() => toggle("communityComments")} />
        </SettingsRow>
        <SettingsRow label="Người theo dõi mới">
          <ToggleSwitch checked={settings.communityFollows} onChange={() => toggle("communityFollows")} />
        </SettingsRow>
        <SettingsRow label="Nhắc đến bạn (@mention)">
          <ToggleSwitch checked={settings.communityMentions} onChange={() => toggle("communityMentions")} />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="Nhóm" description="Thông báo liên quan đến các nhóm bạn tham gia">
        <SettingsRow label="Lời mời vào nhóm">
          <ToggleSwitch checked={settings.groupInvites} onChange={() => toggle("groupInvites")} />
        </SettingsRow>
        <SettingsRow label="Tin nhắn nhóm">
          <ToggleSwitch checked={settings.groupMessages} onChange={() => toggle("groupMessages")} />
        </SettingsRow>
        <SettingsRow label="Thay đổi trong nhóm" description="Đổi tên, ảnh đại diện, thành viên mới...">
          <ToggleSwitch checked={settings.groupUpdates} onChange={() => toggle("groupUpdates")} />
        </SettingsRow>
      </SettingsCard>
    </div>
  );
}