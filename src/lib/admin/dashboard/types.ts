export type TimeRange = "7D" | "30D" | "90D";

export type ChartPoint = {
  label: string;
  value: number;
};

export type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalComments: number;
};

export type TopPostAttachment = {
  name: string;
  size: string;
  type: string;
  url?: string;
  docId?: string;
};

export type TopPostItem = {
  id: string;
  authorId: string;
  content: string;
  excerpt: string;
  authorName: string;
  authorUsername: string;
  avatarUrl: string | null;
  likeCount: number;
  commentCount: number;
  images?: string[];
  mediaTypes?: string[];
  attachment?: TopPostAttachment;
  tags: string[];
  visibility: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
  createdAt: string;
  editedAt: string | null;
};

export type TopActiveUserItem = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  actionCount: number;
};

export const RANGE_LABELS: Record<TimeRange, string> = {
  "7D": "7 ngày qua",
  "30D": "30 ngày qua",
  "90D": "90 ngày qua",
};

export const RANGE_DAYS: Record<TimeRange, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
};