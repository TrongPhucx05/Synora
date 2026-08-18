import type { LucideIcon } from "lucide-react";
import {
  FileX,
  Clock,
  Ban,
  UserCheck,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";

export type AuditActionType =
  | "POST_REMOVED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_BANNED"
  | "ACCOUNT_UNLOCKED"
  | "GROUP_DISABLED"
  | "GROUP_ENABLED"
  | "GROUP_DELETED";

export type AdminActor = {
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type AuditLogEntry = {
  id: string;
  actor: AdminActor;
  action: AuditActionType;
  targetType: "USER" | "GROUP" | "POST";
  targetLabel: string;
  detail?: string;
  reasonLabel?: string;
  notifiedUser: boolean;
  flaggedUser: boolean;
  suspendedUntil?: string;
  createdAt: string;
};

export const ACTION_LABELS: Record<AuditActionType, string> = {
  POST_REMOVED: "Xóa bài viết",
  ACCOUNT_SUSPENDED: "Tạm khóa người dùng",
  ACCOUNT_BANNED: "Khóa vĩnh viễn người dùng",
  ACCOUNT_UNLOCKED: "Mở khóa người dùng",
  GROUP_DISABLED: "Vô hiệu hóa nhóm",
  GROUP_ENABLED: "Mở lại nhóm",
  GROUP_DELETED: "Xóa nhóm",
};

export const ACTION_GROUP: Record<
  AuditActionType,
  "USER" | "GROUP" | "CONTENT"
> = {
  POST_REMOVED: "CONTENT",
  ACCOUNT_SUSPENDED: "USER",
  ACCOUNT_BANNED: "USER",
  ACCOUNT_UNLOCKED: "USER",
  GROUP_DISABLED: "GROUP",
  GROUP_ENABLED: "GROUP",
  GROUP_DELETED: "GROUP",
};

export const GROUP_LABELS: Record<string, string> = {
  ALL: "Tất cả nhóm hành động",
  USER: "Người dùng",
  GROUP: "Nhóm",
  CONTENT: "Nội dung",
};

export const ACTION_ICON: Record<AuditActionType, LucideIcon> = {
  POST_REMOVED: FileX,
  ACCOUNT_SUSPENDED: Clock,
  ACCOUNT_BANNED: Ban,
  ACCOUNT_UNLOCKED: UserCheck,
  GROUP_DISABLED: Lock,
  GROUP_ENABLED: Unlock,
  GROUP_DELETED: Trash2,
};

export const ACTION_BADGE: Record<AuditActionType, string> = {
  POST_REMOVED: "bg-orange-50 text-orange-600",
  ACCOUNT_SUSPENDED: "bg-amber-50 text-amber-600",
  ACCOUNT_BANNED: "bg-red-50 text-red-600",
  ACCOUNT_UNLOCKED: "bg-emerald-50 text-emerald-600",
  GROUP_DISABLED: "bg-amber-50 text-amber-600",
  GROUP_ENABLED: "bg-emerald-50 text-emerald-600",
  GROUP_DELETED: "bg-red-50 text-red-600",
};
