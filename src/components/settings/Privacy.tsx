"use client";
import { useEffect, useRef, useState } from "react";
import { Ban, MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingsCard } from "./SettingsCard";
import {
  BlockedUsersModal,
  BlockedItemMenu,
  type BlockedUser,
} from "./BlockModal";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { ReportModal } from "@/components/ui/ReportModal";
import { fetchBlockedUsers, unblockUser } from "@/lib/block/utils";
import { useSyncedBoolean, useSyncedPermission } from "@/lib/settings/hooks";
import { clsx } from "clsx";

const PREVIEW_LIMIT = 5;

export function PrivacySection() {
  const { showToast } = useToast();
  const {
    value: showActivity,
    loading: loadingActivity,
    toggle: toggleActivity,
  } = useSyncedBoolean({
    key: "activityStatus",
    apiPath: "/api/settings/activity-status",
    field: "showActivityStatus",
  });
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [reportingUser, setReportingUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const t = useTranslations("settings.privacy");

  useEffect(() => {
    fetchBlockedUsers()
      .then(setBlocked)
      .catch(() => setBlocked([]))
      .finally(() => setLoadingBlocked(false));
  }, []);

  const sortedBlocked = [...blocked].sort(
    (a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime(),
  );
  const preview = sortedBlocked.slice(0, PREVIEW_LIMIT);

  const handleUnblock = async (id: string) => {
    const prev = blocked;
    setBlocked((p) => p.filter((u) => u.id !== id));
    try {
      await unblockUser(id);
      showToast(t("blockList.unblockSuccess"), "success");
    } catch (e) {
      setBlocked(prev);
      showToast(
        e instanceof Error ? e.message : t("blockList.unblockError"),
        "error",
      );
    }
  };

  const handleReport = (id: string) => {
    const user = blocked.find((u) => u.id === id);
    setReportingUser({
      id,
      name: user?.name ?? t("blockList.defaultReportName"),
    });
  };

  const {
    value: friendRequestPermission,
    loading: loadingPermission,
    update: updatePermission,
  } = useSyncedPermission({
    key: "friendRequestPermission",
    apiPath: "/api/settings/friend-request-permission",
    field: "friendRequestPermission",
  });

  const {
    value: messageFromFriendsOnly,
    loading: loadingMessagePrivacy,
    toggle: toggleMessagePrivacy,
  } = useSyncedBoolean({
    key: "messageFromFriendsOnly",
    apiPath: "/api/settings/message-privacy",
    field: "messageFromFriendsOnly",
    defaultValue: false,
  });

  const {
    value: showFriendsList,
    loading: loadingFriendsListVisibility,
    toggle: toggleFriendsListVisibility,
  } = useSyncedBoolean({
    key: "showFriendsList",
    apiPath: "/api/settings/friends-list-visibility",
    field: "showFriendsList",
    defaultValue: true,
  });

  const permissionOptions: {
    value: "EVERYONE" | "FRIENDS_OF_FRIENDS" | "NOBODY";
    label: string;
    desc: string;
  }[] = [
    {
      value: "EVERYONE",
      label: t("friendRequestPermission.everyone.label"),
      desc: t("friendRequestPermission.everyone.desc"),
    },
    {
      value: "FRIENDS_OF_FRIENDS",
      label: t("friendRequestPermission.friendsOfFriends.label"),
      desc: t("friendRequestPermission.friendsOfFriends.desc"),
    },
    {
      value: "NOBODY",
      label: t("friendRequestPermission.nobody.label"),
      desc: t("friendRequestPermission.nobody.desc"),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-surface border border-surface-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary">
            {t("activityStatus.title")}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {t("activityStatus.desc")}
          </p>
        </div>
        <ToggleSwitch
          checked={showActivity}
          disabled={loadingActivity}
          onChange={() => {
            toggleActivity().catch(() =>
              showToast(t("activityStatus.updateError"), "error"),
            );
          }}
        />
      </div>

      <SettingsCard
        title={t("blockList.title")}
        description={t("blockList.desc")}
      >
        {loadingBlocked ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 animate-pulse"
              >
                <div className="w-9 h-9 rounded-full bg-surface-100 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-2.5 bg-surface-100 rounded-full w-1/3" />
                  <div className="h-2 bg-surface-100 rounded-full w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : blocked.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2 text-text-muted">
            <div className="w-11 h-11 rounded-full bg-surface-100 flex items-center justify-center">
              <Ban size={18} className="opacity-50" />
            </div>
            <p className="text-xs">{t("blockList.empty")}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              {preview.map((u) => {
                const menuOpen = menuOpenId === u.id;
                return (
                  <div key={u.id} className="flex items-center gap-3 py-2">
                    <Avatar
                      src={u.avatarUrl ?? undefined}
                      initials={u.name.slice(0, 2).toUpperCase()}
                      size="sm"
                      shape="circle"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {u.name}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        @{u.username}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <button
                        onClick={() => setMenuOpenId(menuOpen ? null : u.id)}
                        ref={(el) => {
                          buttonRefs.current[u.id] = el;
                        }}
                        className="p-1.5 rounded-full hover:bg-surface-100 text-text-muted transition-colors"
                      >
                        <MoreVertical size={15} />
                      </button>
                      {menuOpen && (
                        <BlockedItemMenu
                          anchorRef={{ current: buttonRefs.current[u.id] }}
                          user={u}
                          onClose={() => setMenuOpenId(null)}
                          onUnblock={() => {
                            setMenuOpenId(null);
                            handleUnblock(u.id);
                          }}
                          onReport={() => {
                            setMenuOpenId(null);
                            handleReport(u.id);
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="self-start text-xs font-semibold text-primary hover:underline"
            >
              {t("blockList.viewAll", { count: blocked.length })}
            </button>
          </>
        )}
      </SettingsCard>

      <SettingsCard
        title={t("friendRequestPermission.title")}
        description={t("friendRequestPermission.desc")}
      >
        <div className="flex flex-col gap-2">
          {permissionOptions.map((opt) => (
            <button
              key={opt.value}
              disabled={loadingPermission}
              onClick={() => {
                updatePermission(opt.value).catch(() =>
                  showToast(t("friendRequestPermission.updateError"), "error"),
                );
              }}
              className={clsx(
                "flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors disabled:opacity-50",
                friendRequestPermission === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-surface-200 hover:bg-surface-50",
              )}
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {opt.label}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
              </div>
              <div
                className={clsx(
                  "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                  friendRequestPermission === opt.value
                    ? "border-primary"
                    : "border-surface-300",
                )}
              >
                {friendRequestPermission === opt.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      </SettingsCard>

      <div className="bg-surface border border-surface-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary">
            {t("messagePrivacy.title")}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {t("messagePrivacy.desc")}
          </p>
        </div>
        <ToggleSwitch
          checked={messageFromFriendsOnly}
          disabled={loadingMessagePrivacy}
          onChange={() => {
            toggleMessagePrivacy().catch(() =>
              showToast(t("messagePrivacy.updateError"), "error"),
            );
          }}
        />
      </div>

      <div className="bg-surface border border-surface-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary">
            {t("friendsListVisibility.title")}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {t("friendsListVisibility.desc")}
          </p>
        </div>
        <ToggleSwitch
          checked={showFriendsList}
          disabled={loadingFriendsListVisibility}
          onChange={() => {
            toggleFriendsListVisibility().catch(() =>
              showToast(t("friendsListVisibility.updateError"), "error"),
            );
          }}
        />
      </div>

      {modalOpen && (
        <BlockedUsersModal
          users={blocked}
          onClose={() => setModalOpen(false)}
          onUnblock={handleUnblock}
          onReport={handleReport}
        />
      )}

      {reportingUser && (
        <ReportModal
          targetType="USER"
          targetId={reportingUser.id}
          title={t("blockList.reportTitle", { name: reportingUser.name })}
          onClose={() => setReportingUser(null)}
        />
      )}
    </div>
  );
}
