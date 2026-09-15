"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Bell,
  BellOff,
  Users,
  ChevronRight,
  ShieldAlert,
  LogOut,
  Flag,
  Download,
  User,
  MoreHorizontal,
  MessageSquare,
  PhoneCall,
  VideoIcon,
  BanIcon,
  Ban,
  Play,
  Crown,
  UserPlus,
  UserMinus,
  Repeat,
  Camera,
  Loader2,
  Pencil,
  Check,
  Link2,
} from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { ReportModal } from "@/components/ui/ReportModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleBadge } from "@/components/chat/RoleBadge";
import { useOutsideClick } from "@/lib/chat/hooks";
import { useUploadThing } from "@/lib/uploadthing";
import {
  fetchConversationAttachments,
  fetchGroupMembers,
  inviteMembers,
  removeMember,
  transferLeader,
  leaveGroup,
  disbandGroup,
  updateConversationInfo,
  formatBytes,
  getFileExt,
  getFileColor,
  downloadFile,
  getColorForUser,
  getInitialsFromName,
  fetchInviteLink,
  buildInviteLinkUrl,
  fetchJoinRequests,
  respondJoinRequest,
} from "@/lib/chat/utils";
import type {
  Conversation,
  ConfirmAction,
  SharedAttachment,
  GroupMember,
  GroupInviteLinkInfo,
  JoinRequestItem,
} from "@/lib/chat/types";
import { useUserPresence } from "@/lib/presence/hooks";
import { formatLastSeen } from "@/lib/presence/utils";
import { blockUser, unblockUser } from "@/lib/block/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function MediaModal({
  tab: init,
  media,
  docs,
  initialIndex,
  onClose,
}: {
  tab: "images" | "files";
  media: SharedAttachment[];
  docs: SharedAttachment[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"images" | "files">(init);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(
    initialIndex ?? null,
  );
  const t = useTranslations("chat.info.media");

  return (
    <>
      <div className="fixed inset-0 bg-black/40 dark:bg-black/25 z-[60]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[380px] bg-surface z-[60] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <p className="text-sm font-bold text-text-primary">{t("title")}</p>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors text-text-muted"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex border-b border-surface-100 px-5">
          {(["images", "files"] as const).map((tab2) => (
            <button
              key={tab2}
              onClick={() => setTab(tab2)}
              className={clsx(
                "py-3 mr-7 text-xs font-semibold border-b-2 transition-colors",
                tab === tab2
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary",
              )}
            >
              {tab2 === "images"
                ? t("imagesTab", { count: media.length })
                : t("filesTab", { count: docs.length })}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "images" ? (
            media.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-8">
                {t("noImages")}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {media.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setLightboxIndex(i)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-surface-200 hover:opacity-80 transition-opacity"
                  >
                    {m.type === "VIDEO" ? (
                      <>
                        <video
                          src={m.url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <Play size={14} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={m.url}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )
          ) : docs.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-8">
              {t("noFiles")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {docs.map((f) => {
                const ext = getFileExt(f.name);
                return (
                  <button
                    key={f.id}
                    onClick={() => downloadFile(f.url, f.name)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 transition-colors group border border-surface-100 text-left w-full"
                  >
                    <div
                      className={clsx(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-white text-[9px] font-bold shrink-0",
                        getFileColor(ext),
                      )}
                    >
                      {ext}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">
                        {f.name}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {formatBytes(f.size)}
                      </p>
                    </div>
                    <Download
                      size={13}
                      className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && media[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 dark:bg-black/70 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(
                  media[lightboxIndex].url,
                  media[lightboxIndex].name,
                );
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              title={t("download")}
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => setLightboxIndex(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            {media[lightboxIndex].type === "VIDEO" ? (
              <video
                src={media[lightboxIndex].url}
                controls
                autoPlay
                className="max-w-[85vw] max-h-[85vh] rounded-lg"
              />
            ) : (
              <img
                src={media[lightboxIndex].url}
                alt={media[lightboxIndex].name}
                className="max-w-[85vw] max-h-[85vh] rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function MemberMenu({
  member,
  isRequesterLeader,
  onClose,
  onRemove,
  onTransfer,
  onDM,
}: {
  member: GroupMember;
  isRequesterLeader: boolean;
  onClose: () => void;
  onRemove: () => void;
  onTransfer: () => void;
  onDM: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);
  const t = useTranslations("chat.info.memberMenu");

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 w-48 bg-surface rounded-xl shadow-lg border border-surface-200 py-1 z-50 overflow-hidden"
    >
      <Link
        href={`/profile/${member.username}`}
        onClick={onClose}
        className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <User size={13} className="text-text-muted shrink-0" />
        {t("profile")}
      </Link>
      <button
        onClick={() => {
          onDM();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <MessageSquare size={13} className="text-text-muted shrink-0" />
        {t("directMessage")}
      </button>

      {isRequesterLeader && (
        <>
          <div className="h-px bg-surface-100 my-0.5" />
          <button
            onClick={() => {
              onTransfer();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
          >
            <Repeat size={13} className="text-text-muted shrink-0" />
            {t("transferRole")}
          </button>
          <button
            onClick={() => {
              onRemove();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
          >
            <UserMinus size={13} className="shrink-0" />
            {t("removeFromGroup")}
          </button>
        </>
      )}
    </div>
  );
}

function InviteMembersModal({
  conversationId,
  existingUserIds,
  onClose,
  onInvited,
  onStartDM,
}: {
  conversationId: string;
  existingUserIds: string[];
  onClose: () => void;
  onInvited: () => void;
  onStartDM: (userId: string, username: string) => void;
}) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState<
    {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslations("chat.info.invite");
  const tc = useTranslations("common");
  const tu = useTranslations("chat.utils");

  useEffect(() => {
    fetch("/api/users/suggested")
      .then((r) => r.json())
      .then((data) => setFriends(data.users ?? data ?? []))
      .catch(() => setFriends([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = friends.filter(
    (f) =>
      !existingUserIds.includes(f.id) &&
      (f.displayName.toLowerCase().includes(search.toLowerCase()) ||
        f.username.toLowerCase().includes(search.toLowerCase())),
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const handleInvite = async () => {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const usernames = friends
        .filter((f) => selected.includes(f.id))
        .map((f) => f.username);
      await inviteMembers(conversationId, usernames, tu);
      onInvited();
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("genericError"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/35 z-[70]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] max-h-[70vh] bg-surface rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <p className="text-sm font-bold text-text-primary">{t("title")}</p>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-100 rounded-lg text-text-muted"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-surface-100">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full px-3 py-2 bg-surface-100 rounded-lg text-xs placeholder:text-text-muted focus:outline-none border border-transparent focus:border-primary focus:bg-surface transition-colors"
          />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-text-muted text-xs gap-2">
              <Loader2 size={14} className="animate-spin" /> {tc("loading")}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-8">
              {t("noOneToAdd")}
            </p>
          ) : (
            filtered.map((f) => (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-5 py-2.5 transition-colors",
                  selected.includes(f.id)
                    ? "bg-primary/8"
                    : "hover:bg-surface-50",
                )}
              >
                <Avatar
                  src={f.avatarUrl}
                  initials={getInitialsFromName(f.displayName)}
                  color={getColorForUser(f.id)}
                  size="sm"
                />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">
                    {f.displayName}
                  </p>
                  <p className="text-[10px] text-text-muted">@{f.username}</p>
                </div>
                <div
                  className={clsx(
                    "w-4 h-4 rounded-full border-2 shrink-0",
                    selected.includes(f.id)
                      ? "bg-primary border-primary"
                      : "border-surface-300",
                  )}
                />
              </button>
            ))
          )}
        </div>
        <div className="px-5 py-3 border-t border-surface-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-surface-200 text-xs font-semibold text-text-secondary hover:bg-surface-50"
          >
            {tc("cancel")}
          </button>
          <button
            onClick={handleInvite}
            disabled={selected.length === 0 || submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            {t("addCount", { count: selected.length })}
          </button>
        </div>
      </div>
    </>
  );
}

function MembersModal({
  conversationId,
  currentUserId,
  onClose,
  onStartDM,
  onMembersChanged,
}: {
  conversationId: string;
  currentUserId: string;
  onClose: () => void;
  onStartDM: (userId: string, username: string) => void;
  onMembersChanged?: () => void;
}) {
  const { showToast } = useToast();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    type: "remove" | "transfer";
    member: GroupMember;
  } | null>(null);
  const t = useTranslations("chat.info.membersModal");
  const tc = useTranslations("common");
  const tu = useTranslations("chat.utils");

  const requester = members.find((m) => m.userId === currentUserId);
  const isRequesterLeader = requester?.isLeader ?? false;

  const load = async () => {
    setLoading(true);
    try {
      setMembers(await fetchGroupMembers(conversationId, tu));
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [conversationId]);

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    try {
      if (confirmTarget.type === "remove") {
        await removeMember(conversationId, confirmTarget.member.userId, tu);
        showToast(t("removedToast"), "success");
      } else {
        await transferLeader(conversationId, confirmTarget.member.userId, tu);
        showToast(t("transferredToast"), "success");
      }
      await load();
      onMembersChanged?.();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("genericError"), "error");
    } finally {
      setConfirmTarget(null);
    }
  };

  const acceptedCount = members.filter((m) => m.isAccepted).length;
  const pendingCount = members.filter((m) => !m.isAccepted).length;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 dark:bg-black/25 z-[60]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[320px] bg-surface z-[60] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <div>
            <p className="text-sm font-bold text-text-primary">{t("title")}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {pendingCount > 0
                ? t("ratioWithPending", {
                    accepted: acceptedCount,
                    total: members.length,
                    pending: pendingCount,
                  })
                : t("ratio", {
                    accepted: acceptedCount,
                    total: members.length,
                  })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors text-text-muted"
          >
            <X size={15} />
          </button>
        </div>

        {isRequesterLeader && (
          <div className="px-5 py-3 border-b border-surface-100">
            <button
              onClick={() => setInviteOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
            >
              <UserPlus size={13} />
              {t("inviteMembers")}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-text-muted text-xs gap-2">
              <Loader2 size={14} className="animate-spin" /> {tc("loading")}
            </div>
          ) : (
            members.map((m) => {
              const isMe = m.userId === currentUserId;
              return (
                <div
                  key={m.userId}
                  className="relative flex items-center gap-3 px-5 py-3 hover:bg-surface-50 transition-colors group"
                >
                  <button
                    onClick={() => !isMe && onStartDM(m.userId, m.username)}
                    className={isMe ? "cursor-default" : "cursor-pointer"}
                    disabled={isMe}
                  >
                    <Avatar
                      src={m.avatarUrl}
                      initials={getInitialsFromName(m.displayName)}
                      color={getColorForUser(m.userId)}
                      size="md"
                      shape="circle"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {isMe ? `${m.displayName} ${t("youSuffix")}` : m.displayName}
                      </p>
                      <RoleBadge isLeader={m.isLeader} />
                      {!m.isAccepted && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 px-1.5 py-0.5 rounded-full">
                          {t("pendingBadge")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      @{m.username}
                    </p>
                  </div>
                  {!isMe && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === m.userId ? null : m.userId)
                        }
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-surface-200 rounded-lg transition-all text-text-muted"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {openMenu === m.userId && (
                        <MemberMenu
                          member={m}
                          isRequesterLeader={isRequesterLeader}
                          onClose={() => setOpenMenu(null)}
                          onRemove={() =>
                            setConfirmTarget({ type: "remove", member: m })
                          }
                          onTransfer={() =>
                            setConfirmTarget({ type: "transfer", member: m })
                          }
                          onDM={() => onStartDM(m.userId, m.username)}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {inviteOpen && (
        <InviteMembersModal
          conversationId={conversationId}
          existingUserIds={members.map((m) => m.userId)}
          onClose={() => setInviteOpen(false)}
          onInvited={load}
          onStartDM={onStartDM}
        />
      )}

      {confirmTarget && (
        <>
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/25 z-[70]"
            onClick={() => setConfirmTarget(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] bg-surface rounded-2xl shadow-2xl z-[70] p-6">
            <p className="text-sm font-bold text-text-primary mb-1">
              {confirmTarget.type === "remove"
                ? t("removeConfirmTitle", { name: confirmTarget.member.displayName })
                : t("transferConfirmTitle", { name: confirmTarget.member.displayName })}
            </p>
            <p className="text-xs text-text-muted mb-5">
              {confirmTarget.type === "remove"
                ? t("removeConfirmDesc")
                : t("transferConfirmDesc")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className={clsx(
                  "w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-colors",
                  confirmTarget.type === "remove"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-primary hover:bg-primary-700",
                )}
              >
                {confirmTarget.type === "remove"
                  ? t("removeBtn")
                  : t("transferBtn")}
              </button>
              <button
                onClick={() => setConfirmTarget(null)}
                className="w-full py-2.5 rounded-xl border border-surface-200 text-xs font-semibold text-text-secondary hover:bg-surface-50 transition-colors"
              >
                {tc("cancel")}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function RenameGroupModal({
  currentName,
  onClose,
  onSave,
}: {
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const [value, setValue] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const t = useTranslations("chat.info.rename");
  const tc = useTranslations("common");

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === currentName || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("genericError"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/35 z-[70]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-surface rounded-2xl shadow-2xl z-[70] p-6">
        <p className="text-sm font-bold text-text-primary mb-4">{t("title")}</p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") onClose();
          }}
          maxLength={50}
          className="w-full px-3 py-2.5 border border-surface-200 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary transition-colors mb-1"
          placeholder={t("placeholder")}
        />
        <p className="text-[10px] text-text-muted text-right mb-4">
          {value.trim().length}/50
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-surface-200 text-xs font-semibold text-text-secondary hover:bg-surface-50 transition-colors"
          >
            {tc("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !value.trim() || value.trim() === currentName}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            {tc("save")}
          </button>
        </div>
      </div>
    </>
  );
}

function LeaveChoiceModal({
  onClose,
  onChooseTransfer,
  onChooseDisband,
}: {
  onClose: () => void;
  onChooseTransfer: () => void;
  onChooseDisband: () => void;
}) {
  const t = useTranslations("chat.info.leaveChoice");
  const tc = useTranslations("common");
  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/35 z-[70]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-surface rounded-2xl shadow-2xl z-[70] p-6">
        <p className="text-sm font-bold text-text-primary mb-1">{t("title")}</p>
        <p className="text-xs text-text-muted mb-5">{t("desc")}</p>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={onChooseTransfer}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-700 transition-colors"
            >
              {t("transferAndLeave")}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-surface-200 text-xs font-semibold text-text-secondary hover:bg-surface-50 transition-colors"
            >
              {tc("cancel")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function TransferLeaderAndLeaveModal({
  members,
  currentUserId,
  onClose,
  onConfirm,
}: {
  members: GroupMember[];
  currentUserId: string;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const candidates = members.filter((m) => m.userId !== currentUserId);
  const t = useTranslations("chat.info.transferLeave");
  const tc = useTranslations("common");

  const handleConfirm = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(selected);
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("genericError"), "error");
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/35 z-[70]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] max-h-[70vh] bg-surface rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100">
          <p className="text-sm font-bold text-text-primary">{t("title")}</p>
          <p className="text-xs text-text-muted mt-0.5">{t("desc")}</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {candidates.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-8">
              {t("noOtherMembers")}
            </p>
          ) : (
            candidates.map((m) => (
              <button
                key={m.userId}
                onClick={() => setSelected(m.userId)}
                className={clsx(
                  "w-full flex items-center gap-3 px-5 py-2.5 transition-colors",
                  selected === m.userId
                    ? "bg-primary/8"
                    : "hover:bg-surface-50",
                )}
              >
                <Avatar
                  src={m.avatarUrl}
                  initials={getInitialsFromName(m.displayName)}
                  color={getColorForUser(m.userId)}
                  size="sm"
                />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">
                    {m.displayName}
                  </p>
                  <p className="text-[10px] text-text-muted">@{m.username}</p>
                </div>
                <div
                  className={clsx(
                    "w-4 h-4 rounded-full border-2 shrink-0",
                    selected === m.userId
                      ? "bg-primary border-primary"
                      : "border-surface-300",
                  )}
                />
              </button>
            ))
          )}
        </div>
        <div className="px-5 py-3 border-t border-surface-100 flex justify-end gap-2">
          <button
            onClick={handleConfirm}
            disabled={!selected || submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            {t("confirmBtn")}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-surface-200 text-xs font-semibold text-text-secondary hover:bg-surface-50 disabled:opacity-50"
          >
            {tc("cancel")}
          </button>
        </div>
      </div>
    </>
  );
}

function DisbandGroupModal({
  groupName,
  onClose,
  onConfirm,
}: {
  groupName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const t = useTranslations("chat.info.disband");
  const tc = useTranslations("common");

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("genericError"), "error");
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/35 z-[70]"
        onClick={() => !submitting && onClose()}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] bg-surface rounded-2xl shadow-2xl z-[70] p-6">
        <p className="text-sm font-bold mb-1">{t("title", { name: groupName })}</p>
        <p className="text-xs text-text-muted mb-5">{t("desc")}</p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            {t("confirmBtn")}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-surface-200 text-xs font-semibold text-text-secondary hover:bg-surface-50 transition-colors disabled:opacity-50"
          >
            {tc("cancel")}
          </button>
        </div>
      </div>
    </>
  );
}

function InviteLinkPanel({
  conversationId,
  onClose,
}: {
  conversationId: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [info, setInfo] = useState<GroupInviteLinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const t = useTranslations("chat.info.inviteLink");
  const tc = useTranslations("common");
  const tu = useTranslations("chat.utils");

  useEffect(() => {
    setLoading(true);
    fetchInviteLink(conversationId, tu)
      .then(setInfo)
      .catch(() => showToast(t("loadFailed"), "error"))
      .finally(() => setLoading(false));
  }, [conversationId]);

  const handleCopy = () => {
    if (!info?.token) return;
    navigator.clipboard.writeText(buildInviteLinkUrl(info.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const expiresText = info ? new Date(info.expiresAt).toLocaleDateString() : "";

  return (
    <>
      <div className="fixed inset-0 bg-black/40 dark:bg-black/25 z-[60]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] bg-surface rounded-2xl shadow-2xl z-[60] p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-text-primary">{t("title")}</p>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-100 rounded-lg text-text-muted"
          >
            <X size={15} />
          </button>
        </div>
        <p className="text-xs text-text-muted mb-4">{t("desc")}</p>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-text-muted text-xs gap-2">
            <Loader2 size={14} className="animate-spin" /> {tc("loading")}
          </div>
        ) : info ? (
          <>
            <div className="flex items-center gap-2 bg-surface-100 rounded-xl px-3 py-2.5 mb-2">
              <p className="flex-1 text-xs text-text-secondary truncate">
                {buildInviteLinkUrl(info.token)}
              </p>
              <button
                onClick={handleCopy}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-semibold hover:bg-primary-700 transition-colors"
              >
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
            <p className="text-[11px] text-text-muted">
              {t("expiresAt", { date: expiresText })}
            </p>
          </>
        ) : null}
      </div>
    </>
  );
}

function JoinRequestsPanel({
  conversationId,
  onClose,
  onProcessed,
}: {
  conversationId: string;
  onClose: () => void;
  onProcessed?: () => void;
}) {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<JoinRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const t = useTranslations("chat.info.joinRequests");
  const tc = useTranslations("common");
  const tu = useTranslations("chat.utils");

  const load = async () => {
    setLoading(true);
    try {
      setRequests(await fetchJoinRequests(conversationId, tu));
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [conversationId]);

  const handleRespond = async (
    userId: string,
    action: "approve" | "reject",
  ) => {
    setActioningId(userId);
    try {
      await respondJoinRequest(conversationId, userId, action, tu);
      setRequests((prev) => prev.filter((r) => r.userId !== userId));
      onProcessed?.();
      showToast(
        action === "approve" ? t("approvedToast") : t("rejectedToast"),
        "success",
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("genericError"), "error");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 dark:bg-black/25 z-[60]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[340px] bg-surface z-[60] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <div>
            <p className="text-sm font-bold text-text-primary">{t("title")}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {t("pendingCount", { count: requests.length })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-100 rounded-lg text-text-muted"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-text-muted text-xs gap-2">
              <Loader2 size={14} className="animate-spin" /> {tc("loading")}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-text-muted px-6">
              <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
                <UserPlus size={22} className="opacity-50" />
              </div>
              <p className="text-xs text-center">{t("empty")}</p>
            </div>
          ) : (
            requests.map((r) => {
              const busy = actioningId === r.userId;
              return (
                <div
                  key={r.userId}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-surface-50 transition-colors"
                >
                  <Avatar
                    src={r.avatarUrl}
                    initials={getInitialsFromName(r.displayName)}
                    size="md"
                    shape="circle"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {r.displayName}
                    </p>
                    <p className="text-[11px] text-text-muted">@{r.username}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRespond(r.userId, "reject")}
                      disabled={busy}
                      className="w-7 h-7 rounded-full bg-surface-100 hover:bg-red-100 dark:hover:bg-red-500/25 flex items-center justify-center text-text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                      title={t("reject")}
                    >
                      <X size={13} />
                    </button>
                    <button
                      onClick={() => handleRespond(r.userId, "approve")}
                      disabled={busy}
                      className="w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors disabled:opacity-50"
                      title={t("approve")}
                    >
                      {busy ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
interface InfoSidebarProps {
  conv: Conversation;
  currentUserId: string;
  onClose: () => void;
  onConvUpdated?: (patch: Partial<Conversation>) => void;
  onStartDM?: (userId: string, username: string) => void;
  onLeaveConversation?: (conversationId: string) => void;
}

export function InfoSidebar({
  conv,
  currentUserId,
  onClose,
  onConvUpdated,
  onStartDM,
  onLeaveConversation,
}: InfoSidebarProps) {
  const { showToast } = useToast();
  const { isOnline, lastActiveAt } = useUserPresence(
    !conv.isGroup ? conv.otherUserId : null,
  );
  const [notifOn, setNotifOn] = useState(true);
  const [mediaModalTab, setMediaModalTab] = useState<"images" | "files" | null>(
    null,
  );
  const [mediaModalIndex, setMediaModalIndex] = useState<number | undefined>(
    undefined,
  );
  const [membersOpen, setMembersOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const [attachments, setAttachments] = useState<SharedAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { startUpload: startAvatarUpload } = useUploadThing("groupAvatar");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [groupAvatarLightbox, setGroupAvatarLightbox] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [leaveChoiceOpen, setLeaveChoiceOpen] = useState(false);
  const [transferLeaveOpen, setTransferLeaveOpen] = useState(false);
  const [disbandOpen, setDisbandOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(avatarMenuRef, () => setAvatarMenuOpen(false));
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [inviteLinkOpen, setInviteLinkOpen] = useState(false);
  const [joinRequestsOpen, setJoinRequestsOpen] = useState(false);
  const [joinRequestCount, setJoinRequestCount] = useState(0);
  const t = useTranslations("chat.info");
  const tc = useTranslations("common");
  const tu = useTranslations("chat.utils");

  useEffect(() => {
    setLoadingAttachments(true);
    fetchConversationAttachments(conv.id, tu)
      .then(setAttachments)
      .catch(() => setAttachments([]))
      .finally(() => setLoadingAttachments(false));
  }, [conv.id]);

  const reloadMembers = useCallback(async () => {
    if (!conv.isGroup) return;
    try {
      const data = await fetchGroupMembers(conv.id, tu);
      setMembers(data);
    } catch {
      setMembers([]);
    }
  }, [conv.id, conv.isGroup]);

  useEffect(() => {
    reloadMembers();
  }, [reloadMembers]);

  const isLeader =
    members.find((m) => m.userId === currentUserId)?.isLeader ?? false;

  useEffect(() => {
    if (!conv.isGroup || !isLeader) return;
    fetchJoinRequests(conv.id, tu)
      .then((r) => setJoinRequestCount(r.length))
      .catch(() => setJoinRequestCount(0));
  }, [conv.id, conv.isGroup, isLeader]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const results = await startAvatarUpload([file]);
      const url = results?.[0]?.ufsUrl ?? results?.[0]?.url;
      const key = results?.[0]?.key;
      if (!url) throw new Error(t("avatarUploadFailed"));
      await updateConversationInfo(conv.id, { avatarUrl: url, avatarKey: key }, tu);
      onConvUpdated?.({ avatarUrl: url });
      showToast(t("avatarChangedToast"), "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("genericError"), "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveName = async (trimmed: string) => {
    await updateConversationInfo(conv.id, { name: trimmed }, tu);
    onConvUpdated?.({ name: trimmed });
  };

  const handleBlockUser = async () => {
    if (!conv.otherUserId) return;
    try {
      await blockUser(conv.otherUserId);
      onConvUpdated?.({ isBlockedByMe: true });
      showToast(t("blockedToast"), "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("genericError"), "error");
    } finally {
      setConfirm(null);
    }
  };

  const handleUnblockUser = async () => {
    if (!conv.otherUserId) return;
    try {
      await unblockUser(conv.otherUserId);
      onConvUpdated?.({ isBlockedByMe: false });
      showToast(t("unblockedToast"), "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("genericError"), "error");
    }
  };

  const handleLeaveClick = () => {
    if (conv.isGroup && isLeader) {
      if (members.length <= 1) {
        setDisbandOpen(true);
      } else {
        setLeaveChoiceOpen(true);
      }
    } else {
      setConfirm("leave");
    }
  };

  const handleSimpleLeave = async () => {
    try {
      await leaveGroup(conv.id, tu);
      showToast(t("leftGroupToast"), "success");
      setConfirm(null);
      onLeaveConversation?.(conv.id);
    } catch (e) {
      showToast(e instanceof Error ? e.message : t("genericError"), "error");
    }
  };

  const handleTransferAndLeave = async (successorId: string) => {
    await leaveGroup(conv.id, tu, successorId);
    showToast(t("transferredAndLeftToast"), "success");
    setTransferLeaveOpen(false);
    onLeaveConversation?.(conv.id);
  };

  const handleDisband = async () => {
    await disbandGroup(conv.id, tu);
    showToast(t("disbandedToast"), "success");
    setDisbandOpen(false);
    onLeaveConversation?.(conv.id);
  };

  const mediaAttachments = attachments.filter(
    (a) => a.type === "IMAGE" || a.type === "VIDEO",
  );
  const docAttachments = attachments.filter((a) => a.type === "DOCUMENT");

  const initials = getInitials(conv.name);
  const acceptedMemberCount = members.filter((m) => m.isAccepted).length;

  return (
    <>
      <div className="w-[280px] shrink-0 border-l border-surface-200 bg-surface flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 shrink-0">
          <p className="text-sm font-bold text-text-primary">{t("header")}</p>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors text-text-muted"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col items-center pt-5 pb-4 px-4 border-b border-surface-100">
          <div className="relative mb-3" ref={avatarMenuRef}>
            <button
              onClick={() => {
                if (conv.isGroup && isLeader) setAvatarMenuOpen((v) => !v);
                else if (conv.avatarUrl) setGroupAvatarLightbox(true);
              }}
              className={clsx(
                "rounded-full",
                (conv.isGroup && isLeader) || conv.avatarUrl
                  ? "cursor-pointer"
                  : "cursor-default",
              )}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-text-muted" />
                </div>
              ) : (
                <Avatar
                  src={conv.avatarUrl}
                  initials={initials}
                  size="xl"
                  shape="circle"
                />
              )}
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            {conv.isGroup && isLeader && avatarMenuOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] w-44 bg-surface rounded-xl shadow-lg border border-surface-200 py-1 z-50 overflow-hidden">
                {conv.avatarUrl && (
                  <button
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      setGroupAvatarLightbox(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
                  >
                    <User size={13} className="text-text-muted shrink-0" />
                    {t("viewGroupPhoto")}
                  </button>
                )}
                <button
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    avatarInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
                >
                  <Camera size={13} className="text-text-muted shrink-0" />
                  {t("changeGroupPhoto")}
                </button>
              </div>
            )}
          </div>
          <p className="text-sm font-bold text-text-primary text-center mt-1">
            {conv.name}
          </p>
          {conv.isGroup && isLeader && (
            <button
              onClick={() => setRenameOpen(true)}
              className="mt-1.5 flex items-center gap-1 text-[11px] text-text-muted hover:text-primary transition-colors"
            >
              <Pencil size={11} />
              {t("renameGroup")}
            </button>
          )}
          {!conv.isGroup &&
            (isOnline ? (
              <p className="text-xs text-green-500 dark:text-green-400 mt-0.5 font-medium">
                ● {t("activeNow")}
              </p>
            ) : (
              formatLastSeen(lastActiveAt) && (
                <p className="text-xs text-text-muted mt-0.5 font-medium">
                  {formatLastSeen(lastActiveAt)}
                </p>
              )
            ))}
          {!conv.isGroup && conv.otherUsername && !conv.isPending && (
            <Link
              href={`/profile/${conv.otherUsername}`}
              className="mt-2.5 px-3.5 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1.5"
            >
              <User size={11} />
              {t("viewProfile")}
            </Link>
          )}
        </div>
        {conv.isPending ? (
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-text-muted">
              {conv.isGroup
                ? t("acceptGroupInviteHint")
                : t("acceptConvHint")}
            </p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-surface-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                      notifOn ? "bg-primary/10" : "bg-surface-100",
                    )}
                  >
                    {notifOn ? (
                      <Bell size={14} className="text-primary" />
                    ) : (
                      <BellOff size={14} className="text-text-muted" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      {t("notifications")}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {notifOn ? t("notifOn") : t("notifOff")}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={notifOn}
                  onChange={() => setNotifOn((v) => !v)}
                />
              </div>
            </div>
          </>
        )}

        {conv.isGroup && (
          <div className="px-4 py-3 border-b border-surface-100 flex flex-col gap-2">
            <button
              onClick={() => setMembersOpen(true)}
              className="w-full flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
                <Users size={14} className="text-blue-500 dark:text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-text-primary">
                  {t("membersLabel")}
                </p>
                <p className="text-[11px] text-text-muted">
                  {t("peopleRatio", {
                    accepted: acceptedMemberCount,
                    total: members.length,
                  })}
                </p>
              </div>
              <ChevronRight
                size={13}
                className="text-text-muted group-hover:text-text-secondary transition-colors"
              />
            </button>

            <button
              onClick={() => setInviteLinkOpen(true)}
              className="w-full flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Link2
                  size={14}
                  className="text-emerald-500 dark:text-emerald-400"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-text-primary">
                  {t("inviteLinkLabel")}
                </p>
                <p className="text-[11px] text-text-muted">
                  {t("inviteLinkDesc")}
                </p>
              </div>
              <ChevronRight
                size={13}
                className="text-text-muted group-hover:text-text-secondary transition-colors"
              />
            </button>

            {isLeader && (
              <button
                onClick={() => setJoinRequestsOpen(true)}
                className="w-full flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center shrink-0 relative">
                  <UserPlus
                    size={14}
                    className="text-amber-500 dark:text-amber-400"
                  />
                  {joinRequestCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {joinRequestCount > 9 ? "9+" : joinRequestCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-text-primary">
                    {t("joinRequestsLabel")}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {joinRequestCount > 0
                      ? t("joinRequests.pendingCount", {
                          count: joinRequestCount,
                        })
                      : t("noRequestsYet")}
                  </p>
                </div>
                <ChevronRight
                  size={13}
                  className="text-text-muted group-hover:text-text-secondary transition-colors"
                />
              </button>
            )}
          </div>
        )}

        <div className="px-4 py-3 border-b border-surface-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-primary">
              {t("mediaFiles")}
            </p>
            {(mediaAttachments.length > 0 || docAttachments.length > 0) && (
              <button
                onClick={() => setMediaModalTab("images")}
                className="text-xs text-primary font-semibold shrink-0 cursor-pointer"
              >
                {t("viewAll")}
              </button>
            )}
          </div>

          {loadingAttachments ? (
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-surface-100 animate-pulse"
                />
              ))}
            </div>
          ) : mediaAttachments.length === 0 && docAttachments.length === 0 ? (
            <p className="text-[11px] text-text-muted py-2">
              {t("noMediaShared")}
            </p>
          ) : (
            <>
              {mediaAttachments.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {mediaAttachments.slice(0, 6).map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMediaModalTab("images");
                        setMediaModalIndex(i);
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                    >
                      {m.type === "VIDEO" ? (
                        <>
                          <video
                            src={m.url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <Play size={11} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={m.url}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {docAttachments.length > 0 && (
                <>
                  <div className="h-px bg-surface-100 mb-2.5" />
                  <div className="flex flex-col gap-1">
                    {docAttachments.slice(0, 2).map((f) => {
                      const ext = getFileExt(f.name);
                      return (
                        <button
                          key={f.id}
                          onClick={() => downloadFile(f.url, f.name)}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-50 transition-colors group cursor-pointer text-left w-full"
                        >
                          <div
                            className={clsx(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-white text-[8px] font-bold shrink-0",
                              getFileColor(ext),
                            )}
                          >
                            {ext}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">
                              {f.name}
                            </p>
                            <p className="text-[11px] text-text-muted">
                              {formatBytes(f.size)}
                            </p>
                          </div>
                          <Download
                            size={11}
                            className="text-text-muted opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-3 flex flex-col gap-0.5">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 px-1">
            {conv.isGroup ? t("groupOptions") : t("options")}
          </p>
          {!conv.isGroup && (
            <button
              onClick={() =>
                conv.isBlockedByMe ? handleUnblockUser() : setConfirm("block")
              }
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group w-full text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-surface-100 group-hover:bg-red-100 dark:group-hover:bg-red-500/15 flex items-center justify-center transition-colors shrink-0">
                <ShieldAlert
                  size={13}
                  className="text-text-muted group-hover:text-red-500 transition-colors"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-secondary group-hover:text-red-500 transition-colors">
                  {conv.isBlockedByMe ? t("unblockUser") : t("blockUser")}
                </p>
                <p className="text-[11px] text-text-muted">
                  {conv.isBlockedByMe
                    ? t("allowMessagingAgain")
                    : t("stopReceivingFromUser")}
                </p>
              </div>
            </button>
          )}
          {conv.isGroup && (
            <button
              onClick={handleLeaveClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group w-full text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-surface-100 group-hover:bg-red-100 dark:group-hover:bg-red-500/15 flex items-center justify-center transition-colors shrink-0">
                <LogOut
                  size={13}
                  className="text-text-muted group-hover:text-red-500 transition-colors"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-secondary group-hover:text-red-500 transition-colors">
                  {t("leaveGroup")}
                </p>
                <p className="text-[11px] text-text-muted">
                  {t("leaveGroupDesc")}
                </p>
              </div>
            </button>
          )}
          {conv.isGroup && isLeader && (
            <button
              onClick={() => setDisbandOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group w-full text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-surface-100 group-hover:bg-red-100 dark:group-hover:bg-red-500/15 flex items-center justify-center transition-colors shrink-0">
                <ShieldAlert
                  size={13}
                  className="text-text-muted group-hover:text-red-500 transition-colors"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-secondary group-hover:text-red-500 transition-colors">
                  {t("disbandGroup")}
                </p>
                <p className="text-[11px] text-text-muted">
                  {t("disbandGroupDesc")}
                </p>
              </div>
            </button>
          )}
          <button
            onClick={() => setConfirm("report")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group w-full text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-surface-100 group-hover:bg-red-100 dark:group-hover:bg-red-500/15 flex items-center justify-center transition-colors shrink-0">
              <Flag
                size={13}
                className="text-text-muted group-hover:text-red-500 transition-colors"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary group-hover:text-red-500 transition-colors">
                {t("report")}
              </p>
              <p className="text-[11px] text-text-muted">{t("reportDesc")}</p>
            </div>
          </button>
        </div>
      </div>

      {renameOpen && (
        <RenameGroupModal
          currentName={conv.name}
          onClose={() => setRenameOpen(false)}
          onSave={handleSaveName}
        />
      )}

      {leaveChoiceOpen && (
        <LeaveChoiceModal
          onClose={() => setLeaveChoiceOpen(false)}
          onChooseTransfer={() => {
            setLeaveChoiceOpen(false);
            setTransferLeaveOpen(true);
          }}
          onChooseDisband={() => {
            setLeaveChoiceOpen(false);
            setDisbandOpen(true);
          }}
        />
      )}

      {transferLeaveOpen && (
        <TransferLeaderAndLeaveModal
          members={members}
          currentUserId={currentUserId}
          onClose={() => setTransferLeaveOpen(false)}
          onConfirm={handleTransferAndLeave}
        />
      )}

      {disbandOpen && (
        <DisbandGroupModal
          groupName={conv.name}
          onClose={() => setDisbandOpen(false)}
          onConfirm={handleDisband}
        />
      )}

      {groupAvatarLightbox && conv.avatarUrl && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 dark:bg-black/70 flex items-center justify-center"
          onClick={() => setGroupAvatarLightbox(false)}
        >
          <button
            onClick={() => setGroupAvatarLightbox(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
          >
            <X size={18} />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <img
              src={conv.avatarUrl}
              alt={conv.name}
              className="max-w-[85vw] max-h-[85vh] rounded-lg"
            />
          </div>
        </div>
      )}

      {mediaModalTab && (
        <MediaModal
          tab={mediaModalTab}
          media={mediaAttachments}
          docs={docAttachments}
          initialIndex={mediaModalIndex}
          onClose={() => {
            setMediaModalTab(null);
            setMediaModalIndex(undefined);
          }}
        />
      )}
      {membersOpen && (
        <MembersModal
          conversationId={conv.id}
          currentUserId={currentUserId}
          onClose={() => {
            setMembersOpen(false);
            reloadMembers();
          }}
          onStartDM={onStartDM ?? (() => {})}
          onMembersChanged={reloadMembers}
        />
      )}

      {confirm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/25 z-[70]"
            onClick={() => setConfirm(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] bg-surface rounded-2xl shadow-2xl z-[70] p-6">
            <p className="text-sm font-bold text-text-primary mb-1">
              {confirm === "block"
                ? t("confirm.blockTitle")
                : confirm === "leave"
                  ? t("confirm.leaveTitle")
                  : t("confirm.reportTitle")}
            </p>
            <p className="text-xs text-text-muted mb-5">
              {confirm === "block"
                ? t("confirm.blockDesc", { name: conv.name })
                : confirm === "leave"
                  ? t("confirm.leaveDesc", { name: conv.name })
                  : conv.isGroup
                    ? t("confirm.reportGroupDesc", { name: conv.name })
                    : t("confirm.reportUserDesc")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm === "leave") handleSimpleLeave();
                  else if (confirm === "block") handleBlockUser();
                  else {
                    setConfirm(null);
                    setReportModalOpen(true);
                  }
                }}
                className={clsx(
                  "flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-colors",
                  "bg-red-500 hover:bg-red-600",
                )}
              >
                {confirm === "block"
                  ? t("confirm.blockBtn")
                  : confirm === "leave"
                    ? t("confirm.leaveBtn")
                    : t("confirm.reportBtn")}
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-xl border border-surface-200 text-xs font-semibold text-text-secondary hover:bg-surface-50 transition-colors"
              >
                {tc("cancel")}
              </button>
            </div>
          </div>
        </>
      )}
      {reportModalOpen &&
        (conv.isGroup ? (
          <ReportModal
            targetType="GROUP"
            targetId={conv.id}
            title={t("reportGroupTitle", { name: conv.name })}
            onClose={() => setReportModalOpen(false)}
          />
        ) : conv.otherUserId ? (
          <ReportModal
            targetType="USER"
            targetId={conv.otherUserId}
            title={t("reportUserTitle", { name: conv.name })}
            onClose={() => setReportModalOpen(false)}
          />
        ) : null)}
      {inviteLinkOpen && (
        <InviteLinkPanel
          conversationId={conv.id}
          onClose={() => setInviteLinkOpen(false)}
        />
      )}

      {joinRequestsOpen && (
        <JoinRequestsPanel
          conversationId={conv.id}
          onClose={() => setJoinRequestsOpen(false)}
          onProcessed={() => {
            setJoinRequestCount((c) => Math.max(0, c - 1));
            reloadMembers();
          }}
        />
      )}
    </>
  );
}