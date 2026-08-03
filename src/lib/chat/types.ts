export type Conversation = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isGroup: boolean;
  otherUsername?: string;
  otherUserId?: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  memberCount?: number;
  isPending?: boolean;
  isDraft?: boolean;
  isSelf?: boolean;
  isArchived?: boolean;
  isHidden?: boolean;
  isBlockedByMe?: boolean;
  hasBlockedMe?: boolean;
};

export type PendingConversation = {
  id: string;
  isGroup: boolean;
  senderId: string;
  senderUsername: string;
  sender: string;
  avatarUrl: string | null;
  content: string | null;
  createdAt: string | null;
  messageCount: number;
  isHidden?: boolean
};

export type GroupMember = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isLeader: boolean;
  joinedAt: string;
};

export type ApiReaction = {
  id: string;
  emoji: string;
  userId: string;
  user: {
    username: string;
    profile: { displayName: string | null } | null;
  };
};

export type AttachmentType = "IMAGE" | "VIDEO" | "DOCUMENT";

export type ApiAttachment = {
  id: string;
  url: string;
  key: string;
  name: string;
  size: number;
  type: AttachmentType;
  mimeType: string | null;
};

export type Attachment = {
  id: string;
  url: string;
  name: string;
  size: string;
  type: AttachmentType;
  mimeType: string | null;
};

export type ApiMessage = {
  id: string;
  content: string | null;
  status: "SENT" | "DELIVERED" | "READ";
  createdAt: string;
  deletedAt: string | null;
  senderId: string;
  pinnedAt: string | null;
  pinnedById: string | null;
  pinnedBy: {
    username: string;
    profile: { displayName: string | null } | null;
  } | null;
  forwardedFromSender: string | null;
  attachments: ApiAttachment[];
  sender: {
    id: string;
    username: string;
    profile: { displayName: string | null; avatarUrl: string | null } | null;
  };
  replyToId: string | null;
  replyTo: {
    id: string;
    content: string | null;
    senderId: string;
    attachments: ApiAttachment[];
    sender: {
      username: string;
      profile: { displayName: string | null } | null;
    };
  } | null;
  reactions: ApiReaction[];
  isSystemMessage: boolean;
};

export type ReactionGroup = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  users: string[];
};

export type Message = {
  id: string;
  senderId: string;
  sender: string;
  initials: string;
  color: string;
  avatarUrl: string | null;
  time: string;
  createdAt: string;
  content: string | null;
  isMe: boolean;
  attachments: Attachment[];
  replyTo?: {
    id: string;
    sender: string;
    content: string;
    isMe?: boolean;
  } | null;
  forwardedFromSender: string | null;
  reactions: ReactionGroup[];
  deletedAt: string | null;
  pinnedAt: string | null;
  pinnedByName: string | null;
  pinnedById: string | null;
  isSystemMessage: boolean;
};

export type PendingMessage = {
  id: number;
  sender: string;
  initials: string;
  color: string;
  content: string;
  time: string;
};

export type PinnedMessage = {
  id: string;
  content: string | null;
  attachments: ApiAttachment[];
  deletedAt: string | null;
  pinnedAt: string;
  senderId: string;
  sender: { username: string; profile: { displayName: string | null } | null };
  pinnedBy: {
    username: string;
    profile: { displayName: string | null } | null;
  };
};

export type BlockedUser = {
  id: number;
  name: string;
  initials: string;
  color: string;
  blockedAt: string;
};

export type SharedFile = {
  name: string;
  size: string;
  type: string;
  color: string;
  date: string;
};

export type SharedImage = {
  id: number;
  bg: string;
};

export type SharedAttachment = ApiAttachment & {
  createdAt: string;
  messageId: string;
};

export type Contact = {
  initials: string;
  color: string;
  name: string;
  active: boolean;
};

export type FilterChip = "all" | "unread" | "group";
export type NewConvTab = "direct" | "group";
export type AvatarMenuPanel = "main" | "pending" | "blocked" | "settings";
export type ConfirmAction = "block" | "leave" | "report";

export type GroupInviteLinkInfo = {
  token: string | null;
  isActive: boolean;
};

export type JoinLinkPreview = {
  conversationId: string;
  name: string | null;
  avatarUrl: string | null;
  memberCount: number;
  viewerStatus: "member" | "invited" | "requested" | "none";
};

export type JoinRequestItem = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  requestedAt: string;
};