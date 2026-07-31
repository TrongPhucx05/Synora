"use client";
import { useEffect, useRef, useState } from "react";
import { Ban, MoreVertical } from "lucide-react";
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
      showToast("Đã bỏ chặn người dùng", "success");
    } catch (e) {
      setBlocked(prev);
      showToast(
        e instanceof Error ? e.message : "Không thể bỏ chặn người dùng",
        "error",
      );
    }
  };

  const handleReport = (id: string) => {
    const user = blocked.find((u) => u.id === id);
    setReportingUser({ id, name: user?.name ?? "người dùng" });
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
      label: "Mọi người",
      desc: "Bất kỳ ai cũng có thể gửi lời mời kết bạn cho bạn",
    },
    {
      value: "FRIENDS_OF_FRIENDS",
      label: "Bạn của bạn bè",
      desc: "Chỉ những người có bạn chung với bạn mới gửi được",
    },
    {
      value: "NOBODY",
      label: "Không ai",
      desc: "Không ai có thể gửi lời mời kết bạn cho bạn",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white border border-surface-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary">
            Trạng thái hoạt động
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Cho phép bạn bè thấy chấm xanh và thời điểm bạn online gần nhất
          </p>
        </div>
        <ToggleSwitch
          checked={showActivity}
          disabled={loadingActivity}
          onChange={() => {
            toggleActivity().catch(() =>
              showToast("Không thể cập nhật trạng thái hoạt động", "error"),
            );
          }}
        />
      </div>

      <SettingsCard
        title="Danh sách chặn"
        description="Những người bạn đã chặn sẽ không thể nhắn tin hoặc xem hồ sơ của bạn"
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
            <p className="text-xs">Bạn chưa chặn ai</p>
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
              Xem tất cả ({blocked.length})
            </button>
          </>
        )}
      </SettingsCard>

      <SettingsCard
        title="Ai có thể gửi lời mời kết bạn"
        description="Kiểm soát ai được phép gửi lời mời kết bạn đến bạn"
      >
        <div className="flex flex-col gap-2">
          {permissionOptions.map((opt) => (
            <button
              key={opt.value}
              disabled={loadingPermission}
              onClick={() => {
                updatePermission(opt.value).catch(() =>
                  showToast("Không thể cập nhật cài đặt", "error"),
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

      <div className="bg-white border border-surface-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary">
            Chỉ bạn bè mới được nhắn tin
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Khi bật, chỉ những người là bạn bè mới có thể mở cuộc trò chuyện với
            bạn
          </p>
        </div>
        <ToggleSwitch
          checked={messageFromFriendsOnly}
          disabled={loadingMessagePrivacy}
          onChange={() => {
            toggleMessagePrivacy().catch(() =>
              showToast("Không thể cập nhật cài đặt tin nhắn", "error"),
            );
          }}
        />
      </div>

      <div className="bg-white border border-surface-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary">
            Hiển thị danh sách bạn bè
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Cho phép người khác xem danh sách bạn bè trên hồ sơ của bạn
          </p>
        </div>
        <ToggleSwitch
          checked={showFriendsList}
          disabled={loadingFriendsListVisibility}
          onChange={() => {
            toggleFriendsListVisibility().catch(() =>
              showToast("Không thể cập nhật cài đặt hồ sơ", "error"),
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
          title={`Báo cáo ${reportingUser.name}`}
          onClose={() => setReportingUser(null)}
        />
      )}
    </div>
  );
}
