"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Share2,
  MessageCircle,
  UserPlus,
  UserCheck,
  Pencil,
  Clock,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import AuthGuardModal from "@/components/ui/AuthGuardModal";
import { useToast } from "@/components/ui/Toast";

type FriendStatus = "none" | "pending" | "friends";

interface ProfileHeaderProps {
  coverUrl?: string | null;
  avatarUrl?: string | null;
  displayName: string;
  username: string;
  sessionUsername?: string;
  isOwner: boolean;
  friendStatus?: FriendStatus;
  incomingRequestId?: string | null;
  profileData?: any;
  onProfileSaved?: () => void;
  onFriendStatusChanged?: () => void;
  isAdmin?: boolean;
}

export function ProfileHeader({
  coverUrl,
  avatarUrl,
  displayName,
  username,
  isOwner,
  friendStatus: initialStatus = "none",
  incomingRequestId: initialIncomingId = null,
  profileData,
  onProfileSaved,
  sessionUsername,
  onFriendStatusChanged,
  isAdmin = false,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [status, setStatus] = useState<FriendStatus>(initialStatus);
  const [incomingRequestId, setIncomingRequestId] = useState<string | null>(
    initialIncomingId,
  );
  const [followLoading, setFollowLoading] = useState(false);
  const [showReplyMenu, setShowReplyMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { showToast } = useToast();
  const canSendFriendRequest = profileData?.canSendFriendRequest ?? true;
  const canMessage = profileData?.canMessage ?? true;

  const handleFollowToggle = async () => {
    if (isAdmin) return;
    if (!sessionUsername) {
      setShowAuthModal(true);
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/profile/${username}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Không thể gửi lời mời kết bạn", "error");
        return;
      }
      setStatus(data.status ?? "none");
      onFriendStatusChanged?.();
    } finally {
      setFollowLoading(false);
    }
  };

  const handleRequestAction = async (action: "accept" | "reject") => {
    if (!incomingRequestId) return;
    setFollowLoading(true);
    setShowReplyMenu(false);
    try {
      const res = await fetch(
        `/api/profile/${sessionUsername}/friend-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: incomingRequestId, action }),
        },
      );
      if (res.ok) {
        if (action === "accept") {
          setStatus("friends");
        } else {
          setStatus("none");
        }
        setIncomingRequestId(null);
        onFriendStatusChanged?.();
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaved = () => {
    setShowEditModal(false);
    onProfileSaved?.();
    router.refresh();
  };

  const ini = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative mb-16">
      <div className="h-40 rounded-2xl overflow-hidden relative bg-slate-200">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt="cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,#e2e5ec,#e2e5ec_10px,#eaecf2_10px,#eaecf2_20px)]" />
        )}
        {isOwner && (
          <button
            onClick={() => setShowEditModal(true)}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/20 hover:bg-black/30 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
          >
            <Camera size={11} /> Đổi ảnh bìa
          </button>
        )}
      </div>

      <div className="absolute -bottom-12">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {ini}
            </div>
          )}
          {isOwner && (
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute bottom-1 right-1 w-6 h-6 bg-white border border-surface-200 rounded-full flex items-center justify-center hover:bg-surface-100 transition-colors shadow-sm"
            >
              <Camera size={11} className="text-text-secondary" />
            </button>
          )}
        </div>
      </div>

      <div className="absolute -bottom-10 right-0 flex items-center gap-2">
        {!isAdmin && (
          <button className="flex items-center gap-1.5 border border-surface-200 bg-white text-text-secondary text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-surface-50 transition-colors">
            <Share2 size={13} /> Chia sẻ
          </button>
        )}

        {isOwner ? (
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 border border-surface-200 bg-white text-text-secondary text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-surface-50 transition-colors"
          >
            <Pencil size={13} /> Chỉnh sửa
          </button>
        ) : (
          !isAdmin && (
            <>
              {canMessage && (
                <button
                  onClick={() => {
                    if (isAdmin) return;
                    if (!sessionUsername) {
                      setShowAuthModal(true);
                      return;
                    }
                    router.push(`/chat?with=${username}`);
                  }}
                  disabled={isAdmin}
                  className={clsx(
                    "flex items-center gap-1.5 border border-surface-200 bg-white text-text-secondary text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                    isAdmin
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-surface-50",
                  )}
                >
                  <MessageCircle size={13} /> Nhắn tin
                </button>
              )}

              {incomingRequestId && status !== "friends" ? (
                <div className="relative">
                  <button
                    onClick={() => setShowReplyMenu((p) => !p)}
                    disabled={followLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors bg-primary text-white hover:bg-primary-700 disabled:opacity-70"
                  >
                    Trả lời <ChevronDown size={13} />
                  </button>
                  {showReplyMenu && (
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
                      <button
                        onClick={() => handleRequestAction("accept")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-text-primary hover:bg-surface-50 transition-colors"
                      >
                        <UserCheck size={13} className="text-primary" /> Chấp
                        nhận
                      </button>
                      <button
                        onClick={() => handleRequestAction("reject")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <span className="text-red-500">✕</span> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {showUnfriendConfirm && (
                    <ConfirmDialog
                      displayName={displayName}
                      onConfirm={() => {
                        setShowUnfriendConfirm(false);
                        handleFollowToggle();
                      }}
                      onCancel={() => setShowUnfriendConfirm(false)}
                    />
                  )}
                  {status === "none" && !canSendFriendRequest ? null : (
                    <button
                      onClick={
                        isAdmin
                          ? undefined
                          : status === "friends"
                            ? () => setShowUnfriendConfirm(true)
                            : handleFollowToggle
                      }
                      disabled={followLoading || isAdmin}
                      className={clsx(
                        "flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-70",
                        isAdmin && "opacity-40 cursor-not-allowed",
                        status === "friends"
                          ? "bg-surface-100 text-text-secondary border border-surface-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                          : status === "pending"
                            ? "bg-surface-50 text-text-muted border border-surface-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                            : "bg-primary text-white hover:bg-primary-700",
                      )}
                    >
                      {status === "friends" ? (
                        <>
                          <UserCheck size={13} /> Bạn bè
                        </>
                      ) : status === "pending" ? (
                        <>
                          <Clock size={13} /> Đã gửi yêu cầu
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} /> Kết bạn
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </>
          )
        )}
      </div>

      {showEditModal && (
        <EditProfileModal
          username={username}
          initial={{
            displayName: profileData?.profile?.displayName,
            bio: profileData?.profile?.bio,
            school: profileData?.profile?.school,
            location: profileData?.profile?.location,
            website: profileData?.profile?.website,
            grade: profileData?.profile?.grade,
            avatarUrl: profileData?.profile?.avatarUrl,
            coverUrl: profileData?.profile?.coverUrl,
          }}
          onClose={() => setShowEditModal(false)}
          onSaved={handleSaved}
        />
      )}
      {showAuthModal && (
        <AuthGuardModal
          onClose={() => setShowAuthModal(false)}
          action="kết bạn với người này"
        />
      )}
    </div>
  );
}
