export type NotifType =
  | "LIKE"
  | "COMMENT"
  | "REPLY"
  | "MENTION"
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPT"
  | "DOCUMENT_APPROVED"
  | "DOCUMENT_REJECTED"
  | "DOCUMENT_REMOVED"
  | "DOCUMENT_REPORTED"
  | "FOLLOW"
  | "MESSAGE"
  | "POST_REMOVED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_BANNED"
  | "ACCOUNT_UNLOCKED"
  | "SYSTEM";

export interface NotifItem {
  id: string;
  type: NotifType;
  text: string;
  sub?: string;
  href: string;
  createdAt: string;
  unread: boolean;
  avatars: string[];
  avatarColors: string[];
  avatarUrls: (string | null)[];
  action?: { accept: string; decline: string } | null;
  requestId?: string;
  commentId?: string;
}