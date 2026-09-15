import type {
  ApiMessage,
  ApiReaction,
  ApiAttachment,
  Attachment,
  SharedAttachment,
  Message,
  ReactionGroup,
  PinnedMessage,
  GroupMember,
  Conversation,
  PendingConversation,
  GroupInviteLinkInfo,
  JoinLinkPreview,
  JoinRequestItem,
} from "./types";

export const RECALL_WINDOW_MS = 24 * 60 * 60 * 1000;
export const DIVIDER_GAP_MS = 30 * 60 * 1000;

type Translator = (key: string, values?: Record<string, any>) => string;

function intlLocale(locale: string): string {
  return locale === "en" ? "en-US" : "vi-VN";
}

export function formatDateDivider(iso: string, locale: string = "vi"): string {
  const d = new Date(iso);
  const loc = intlLocale(locale);
  const datePart = d.toLocaleDateString(loc, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(loc, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${time}`;
}

export function getColorForUser(_userId: string): string {
  return "bg-primary";
}

export function getInitialsFromName(name: string): string {
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function formatMessageTime(iso: string, locale: string = "vi"): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(intlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function canRecallMessage(msg: Message): boolean {
  if (!msg.isMe || msg.deletedAt) return false;
  return Date.now() - new Date(msg.createdAt).getTime() <= RECALL_WINDOW_MS;
}

export function groupReactions(
  reactions: ApiReaction[],
  currentUserId: string,
): ReactionGroup[] {
  const map = new Map<string, ReactionGroup>();
  for (const r of reactions) {
    const name = r.user.profile?.displayName ?? r.user.username;
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count += 1;
      existing.users.push(name);
      if (r.userId === currentUserId) existing.reactedByMe = true;
    } else {
      map.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        reactedByMe: r.userId === currentUserId,
        users: [name],
      });
    }
  }
  return Array.from(map.values());
}

export async function toggleMessageReaction(
  conversationId: string,
  messageId: string,
  emoji: string,
  t: Translator,
): Promise<{ reactions: ApiReaction[] }> {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/${messageId}/reactions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    },
  );
  if (!res.ok) throw new Error(t("cannotToggleReaction"));
  return res.json();
}

export async function recallMessage(
  conversationId: string,
  messageId: string,
  t: Translator,
): Promise<{ id: string; deletedAt: string }> {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/${messageId}`,
    { method: "DELETE" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? t("cannotRecallMessage"));
  }
  return data;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExt(name: string): string {
  return name.split(".").pop()?.toUpperCase() ?? "FILE";
}

export function getFileColor(ext: string): string {
  switch (ext) {
    case "PDF":
      return "bg-red-500";
    case "DOC":
    case "DOCX":
      return "bg-blue-500";
    case "PPT":
    case "PPTX":
      return "bg-orange-500";
    case "XLS":
    case "XLSX":
      return "bg-green-600";
    case "ZIP":
    case "RAR":
      return "bg-purple-500";
    default:
      return "bg-gray-400";
  }
}

export function buildAttachmentLabel(
  attachments: { type: "IMAGE" | "VIDEO" | "DOCUMENT" }[],
  t: Translator,
): string {
  if (attachments.length === 0) return "";

  const imageCount = attachments.filter((a) => a.type === "IMAGE").length;
  const videoCount = attachments.filter((a) => a.type === "VIDEO").length;
  const docCount = attachments.filter((a) => a.type === "DOCUMENT").length;
  const typeCount = [imageCount > 0, videoCount > 0, docCount > 0].filter(
    Boolean,
  ).length;

  if (typeCount > 1)
    return t("attachmentLabel.multipleTypes", { count: attachments.length });
  if (imageCount > 0)
    return imageCount === 1
      ? t("attachmentLabel.oneImage")
      : t("attachmentLabel.multipleImages", { count: imageCount });
  if (videoCount > 0)
    return videoCount === 1
      ? t("attachmentLabel.oneVideo")
      : t("attachmentLabel.multipleVideos", { count: videoCount });
  return docCount === 1
    ? t("attachmentLabel.oneFile")
    : t("attachmentLabel.multipleFiles", { count: docCount });
}

function mapAttachments(list: ApiAttachment[]): Attachment[] {
  return list.map((a) => ({
    id: a.id,
    url: a.url,
    name: a.name,
    size: formatBytes(a.size),
    type: a.type,
    mimeType: a.mimeType,
  }));
}

export function adaptApiMessage(
  msg: ApiMessage,
  currentUserId: string,
  t: Translator,
  locale: string = "vi",
): Message {
  const isMe = msg.senderId === currentUserId;
  const pinnedByName = msg.pinnedBy
    ? (msg.pinnedBy.profile?.displayName ?? msg.pinnedBy.username)
    : null;
  const displayName = msg.sender.profile?.displayName ?? msg.sender.username;
  const initials = getInitialsFromName(displayName);
  const color = getColorForUser(msg.senderId);
  const avatarUrl = msg.sender.profile?.avatarUrl ?? null;

  const replyTo = msg.replyTo
    ? {
        id: msg.replyTo.id,
        sender:
          msg.replyTo.sender.profile?.displayName ??
          msg.replyTo.sender.username,
        content:
          msg.replyTo.content ??
          (msg.replyTo.attachments.length > 0 ? t("replySentFile") : ""),
        isMe: msg.replyTo.senderId === currentUserId,
      }
    : null;

  if (msg.deletedAt) {
    return {
      id: msg.id,
      senderId: msg.senderId,
      sender: displayName,
      initials,
      color,
      avatarUrl,
      time: formatMessageTime(msg.createdAt, locale),
      createdAt: msg.createdAt,
      content: null,
      isMe,
      attachments: [],
      replyTo,
      pinnedAt: msg.pinnedAt,
      pinnedByName: null,
      pinnedById: null,
      forwardedFromSender: msg.forwardedFromSender,
      reactions: [],
      deletedAt: msg.deletedAt,
      isSystemMessage: msg.isSystemMessage ?? false,
    };
  }

  return {
    id: msg.id,
    senderId: msg.senderId,
    sender: displayName,
    initials,
    color,
    avatarUrl,
    time: formatMessageTime(msg.createdAt, locale),
    createdAt: msg.createdAt,
    content: msg.content,
    isMe,
    attachments: mapAttachments(msg.attachments),
    replyTo,
    pinnedAt: msg.pinnedAt,
    pinnedByName,
    pinnedById: msg.pinnedById ?? null,
    forwardedFromSender: msg.forwardedFromSender,
    reactions: groupReactions(msg.reactions, currentUserId),
    deletedAt: null,
    isSystemMessage: msg.isSystemMessage ?? false,
  };
}

export async function pinMessage(
  conversationId: string,
  messageId: string,
  t: Translator,
): Promise<{
  id: string;
  pinnedAt: string;
  pinnedBy: {
    username: string;
    profile: { displayName: string | null } | null;
  };
}> {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/${messageId}/pin`,
    { method: "POST" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? t("cannotPinMessage"));
  return data;
}

export async function unpinMessage(
  conversationId: string,
  messageId: string,
  t: Translator,
): Promise<void> {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/${messageId}/pin`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? t("cannotUnpinMessage"));
  }
}

export async function fetchPinnedMessages(
  conversationId: string,
  t: Translator,
): Promise<PinnedMessage[]> {
  const res = await fetch(
    `/api/conversations/${conversationId}/pinned-messages`,
  );
  if (!res.ok) throw new Error(t("cannotLoadPinned"));
  return res.json();
}

export async function forwardMessage(
  sourceConversationId: string,
  messageId: string,
  targetConversationId: string,
  t: Translator,
): Promise<ApiMessage> {
  const res = await fetch(
    `/api/conversations/${sourceConversationId}/messages/${messageId}/forward`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetConversationId }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? t("cannotForwardMessage"));
  return data;
}

export async function fetchConversationAttachments(
  conversationId: string,
  t: Translator,
): Promise<SharedAttachment[]> {
  const res = await fetch(`/api/conversations/${conversationId}/attachments`);
  if (!res.ok) throw new Error(t("cannotLoadAttachments"));
  return res.json();
}

export function downloadFile(url: string, filename: string): void {
  const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`;
  const a = document.createElement("a");
  a.href = proxyUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function fetchGroupMembers(
  conversationId: string,
  t: Translator,
): Promise<GroupMember[]> {
  const res = await fetch(`/api/conversations/${conversationId}/members`);
  if (!res.ok) throw new Error(t("cannotLoadMembers"));
  const data = await res.json();
  return data.map(
    (m: {
      isLeader: boolean;
      isAccepted: boolean;
      joinedAt: string;
      user: {
        id: string;
        username: string;
        profile: {
          displayName: string | null;
          avatarUrl: string | null;
        } | null;
      };
    }) => ({
      userId: m.user.id,
      username: m.user.username,
      displayName: m.user.profile?.displayName ?? m.user.username,
      avatarUrl: m.user.profile?.avatarUrl ?? null,
      isLeader: m.isLeader,
      isAccepted: m.isAccepted,
      joinedAt: m.joinedAt,
    }),
  );
}

export async function inviteMembers(
  conversationId: string,
  usernames: string[],
  t: Translator,
): Promise<{ added: number }> {
  const res = await fetch(`/api/conversations/${conversationId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? t("cannotAddMembers"));
  return data;
}

export async function removeMember(
  conversationId: string,
  userId: string,
  t: Translator,
): Promise<void> {
  const res = await fetch(
    `/api/conversations/${conversationId}/members/${userId}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? t("cannotRemoveMember"));
  }
}

export async function transferLeader(
  conversationId: string,
  userId: string,
  t: Translator,
): Promise<void> {
  const res = await fetch(
    `/api/conversations/${conversationId}/members/${userId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "transfer_leader" }),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? t("cannotTransferLeader"));
  }
}

export async function updateConversationInfo(
  conversationId: string,
  payload: { avatarUrl?: string; avatarKey?: string; name?: string },
  t: Translator,
): Promise<{ id: string; name: string | null; avatarUrl: string | null }> {
  const res = await fetch(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? t("cannotUpdateGroup"));
  return data;
}

export async function leaveGroup(
  conversationId: string,
  t: Translator,
  transferToUserId?: string,
): Promise<{ left: boolean; newLeaderId?: string }> {
  const res = await fetch(`/api/conversations/${conversationId}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transferToUserId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? t("cannotLeaveGroup"));
  return data;
}

export async function disbandGroup(
  conversationId: string,
  t: Translator,
): Promise<void> {
  const res = await fetch(`/api/conversations/${conversationId}/disband`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? t("cannotDisbandGroup"));
  }
}

export async function fetchPendingConversations(
  t: Translator,
): Promise<PendingConversation[]> {
  const res = await fetch("/api/conversations/pending");
  if (!res.ok) throw new Error(t("cannotLoadPending"));
  return res.json();
}

export async function respondPendingConversation(
  conversationId: string,
  action: "accept" | "reject",
  t: Translator,
): Promise<void> {
  const res = await fetch(`/api/conversations/${conversationId}/pending`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(t("genericError"));
}

export async function searchConversations(q: string): Promise<Conversation[]> {
  const res = await fetch(`/api/conversations?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchInviteLink(
  conversationId: string,
  t: Translator,
): Promise<GroupInviteLinkInfo> {
  const res = await fetch(`/api/conversations/${conversationId}/invite-link`);
  if (!res.ok) throw new Error(t("cannotLoadInviteLink"));
  return res.json();
}

export async function fetchJoinRequests(
  conversationId: string,
  t: Translator,
): Promise<JoinRequestItem[]> {
  const res = await fetch(`/api/conversations/${conversationId}/join-requests`);
  if (!res.ok) throw new Error(t("cannotLoadJoinRequests"));
  return res.json();
}

export async function respondJoinRequest(
  conversationId: string,
  userId: string,
  action: "approve" | "reject",
  t: Translator,
): Promise<void> {
  const res = await fetch(
    `/api/conversations/${conversationId}/join-requests/${userId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? t("genericError"));
  }
}

export async function fetchJoinPreview(
  token: string,
  t: Translator,
): Promise<JoinLinkPreview> {
  const res = await fetch(`/api/groups/join/${token}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? t("invalidInviteLink"));
  return data;
}

export async function submitJoinRequest(
  token: string,
  t: Translator,
): Promise<{ status: string; conversationId: string }> {
  const res = await fetch(`/api/groups/join/${token}`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? t("cannotSendJoinRequest"));
  return data;
}

export function buildInviteLinkUrl(token: string): string {
  if (typeof window === "undefined") return `/join/${token}`;
  return `${window.location.origin}/join/${token}`;
}