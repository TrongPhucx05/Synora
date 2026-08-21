export type SupportRequestStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED";

export type SupportRequestType =
  | "ACCOUNT_SUPPORT"
  | "BUG_REPORT"
  | "FEEDBACK"
  | "BAN_APPEAL"
  | "ACCOUNT_DELETION"
  | "OTHER";

export type SupportRequestPerson = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type AdminSupportRequestRow = {
  id: string;
  code: string;
  user: SupportRequestPerson | null;
  contactEmail: string;
  guestName?: string | null;
  subject: string;
  message: string;
  type: SupportRequestType;
  status: SupportRequestStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};

export type MySupportRequestRow = {
  id: string;
  code: string;
  type: SupportRequestType;
  subject: string;
  status: SupportRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type SupportRequestReplyItem = {
  message: string;
  statusAtReply: SupportRequestStatus;
  createdAt: string;
};

export type TrackedSupportRequest = {
  code: string;
  type: SupportRequestType;
  subject: string;
  message: string;
  status: SupportRequestStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  replies: SupportRequestReplyItem[];
};

export type RateLimitStatusResponse =
  | { allowed: true; remaining: number; limit: number }
  | {
      allowed: false;
      remaining: number;
      limit: number;
      reason: "COOLDOWN" | "DAILY_LIMIT";
      retryAfterSeconds?: number;
      nextResetAt?: string;
    };
