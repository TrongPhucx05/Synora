export type TabKey = "all" | "documents" | "posts" | "people" | "groups" | "topics";

export type ResultType = "document" | "post" | "person" | "group" | "topic";

export type FriendStatus = "none" | "pending" | "friends";

export interface SearchResult {
  id: number;
  type: ResultType;
  title: string;
  subtitle?: string;
  meta?: string;
  tags?: string[];
  stats?: { label: string; value: string | number }[];
  avatar?: string;
  avatarColor?: string;
  avatarUrl?: string | null;
  incomingRequestId?: string | null;
  badge?: string;
  href: string;
  friendStatus?: FriendStatus;
  username?: string;
  sessionUsername?: string | null;
  canSendFriendRequest?: boolean;
  canMessage?: boolean;
}

export interface FilterGroup {
  label: string;
  options: string[];
}

export interface FilterConfig {
  groups: FilterGroup[];
}